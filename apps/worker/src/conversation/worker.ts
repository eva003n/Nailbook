/**
 * Conversation worker — processes the "conversations" queue.
 *
 * Handles:
 *  - Inbound WhatsApp messages (run through the booking FSM)
 *  - Outbound WhatsApp messages enqueued by the FSM
 */

import {
  createWorker,
  JOB_NAMES,
  Queue_Names,
  type NormalisedEvent,
  type OutboundMessage,
} from "@nailbook/core";
import type { Job } from "bullmq";
import { bullConnection, QUEUE_KEY_PREFIX, log as rootLog } from "../lib/index.js";
import { processMessage } from "./processors/workflows/engine.js";
import { whatsappProcessor } from "./processors/whatsapp.processor.js";

const log = rootLog.child({ module: "conversation-worker" });

async function handleWhatsappJob(
  job: Job<NormalisedEvent | OutboundMessage>,
) {
  switch (job.name) {
    // — Inbound WhatsApp messages (enqueued by webhook controller → FSM) —

    case JOB_NAMES.FSM_IN:
      return processMessage(job.data as NormalisedEvent);
    // Outbound Whatsapp messages (enqueued by FSM)
    case JOB_NAMES.FSM_OUT:
      return await whatsappProcessor(job as unknown as Job<OutboundMessage>);

    default:
      log.warn(
        {
          event: "worker.unknown_job",
          queue: Queue_Names.CONVERSATIONS,
          jobName: job.name,
        },
        "Unknown conversation whatsapp job name",
      );
  }
}

// ─── Conversation Worker ─────────────────────────────────────────

/** Creates the worker and starts it consuming. Shutdown is handled in index.ts. */
export function createConversationWorker() {
  return createWorker<NormalisedEvent | OutboundMessage>(
    { queueName: Queue_Names.CONVERSATIONS, workerName: "conversation", concurrency: 1, prefix: QUEUE_KEY_PREFIX + Queue_Names.CONVERSATIONS },
    async (job) => {
      await handleWhatsappJob(job);
    },
    bullConnection,
    log,
  );
}
