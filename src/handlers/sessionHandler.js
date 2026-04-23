const { formatGenericSystemError } = require("../utils/formatter");
const updateSuratFlow = require("./sessionFlows/updateSuratFlow");

const defaultFlowHandlers = {
  UPDATE_SURAT: updateSuratFlow,
};

function isCancelMessage(value = "") {
  const upper = String(value || "").trim().toUpperCase();
  return upper === "BATAL" || upper === "CANCEL";
}

function formatSessionCancelled() {
  return "Proses dibatalkan.";
}

function createSessionHandler({ sessionService, fleetService, auditRepository, logger, flowHandlers = defaultFlowHandlers }) {
  return {
    async continueFlow({ sender, replyTo, text, user }) {
      const activeSession = await sessionService.getSession({ sender, replyTo });
      if (!activeSession) return null;

      if (isCancelMessage(text)) {
        await sessionService.clearSession({ sender, replyTo });
        return formatSessionCancelled();
      }

      const flowHandler = flowHandlers[activeSession.flow];
      if (!flowHandler || typeof flowHandler.handle !== "function") {
        logger.warn({ sender, replyTo, flow: activeSession.flow }, "Unknown session flow, clearing session");
        await sessionService.clearSession({ sender, replyTo });
        return formatGenericSystemError();
      }

      try {
        return await flowHandler.handle({
          session: activeSession,
          sender,
          replyTo,
          text,
          user,
          sessionService,
          fleetService,
          auditRepository,
          logger,
        });
      } catch (error) {
        logger.error({ sender, replyTo, flow: activeSession.flow, err: error }, "Session flow execution failed");
        await sessionService.clearSession({ sender, replyTo });
        return formatGenericSystemError();
      }
    },
  };
}

module.exports = { createSessionHandler, defaultFlowHandlers };
