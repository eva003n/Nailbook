import { _config } from "./config.js"
import  {createLogger} from "@nailbook/core"


 const _logger = createLogger(_config)
 export const logger = _logger.child({module: "api"})
 