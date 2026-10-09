/**
 * Payment worker — processes the "payments" queue.
 *
 * Handles:
 *  - STK Push (initiates M-Pesa payment)
 *  - STK Callback (processes Daraja callback)
 *  - Payment timeout check (queries Daraja if callback never arrives)
 */

import { createWorker, JOB_NAMES, Queue_Names } from "@wannys-nails/core";
import { stkPushProcessor, type StkPushJobData } from "./processors/stk-push.processor.js";
import { processStkCallback, type StkCallbackJobData } from "./processors/stk-callback.processor.js";
import { paymentVerifyProcessor, reconcileStalePayments, type PaymentVerifyJobData } from "./processors/payment-verify.processor.js";
import type { Job } from "bullmq";
import { bullConnection, QUEUE_KEY_PREFIX, log as rootLog } from "../lib/index.js";

const log = rootLog.child({module: "payment_processor"});

// ─── Union type for all payment job data ─────────────────────

type PaymentJobData = StkPushJobData | StkCallbackJobData | PaymentVerifyJobData;

// ─── Payment Worker ──────────────────────────────────────────

/** Creates the worker and starts it consuming. Shutdown is handled in index.ts. */
export function createPaymentWorker() {
  return createWorker<PaymentJobData>(
    { queueName: Queue_Names.PAYMENTS, workerName: "payment", concurrency: 1, prefix: QUEUE_KEY_PREFIX + Queue_Names.PAYMENTS, limiter: {max: 5, duration: 60_000 }  },
    async (job: Job<PaymentJobData>) => {
      switch (job.name) {
        case JOB_NAMES.STK_PUSH:
          return stkPushProcessor(job as Job<StkPushJobData>);

        case JOB_NAMES.STK_CALLBACK:
          return processStkCallback(job as Job<StkCallbackJobData>);

        case JOB_NAMES.STK_TIMEOUT_CHECK:
          return paymentVerifyProcessor(job as Job<PaymentVerifyJobData>);

        case JOB_NAMES.STK_RECONCILIATION:
          return reconcileStalePayments()
        default:
          log.warn(
            { event: "worker.unknown_job", queue: Queue_Names.PAYMENTS, jobName: job.name },
            "Unknown job name",
          );
      }
    },
    bullConnection,
    log,
  );
}
