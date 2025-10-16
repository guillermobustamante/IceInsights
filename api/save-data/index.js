const { saveWorkbookData } = require("../lib/excelRepository");

module.exports = async function run(context, req) {
  try {
    if (!req.body) {
      context.res = {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          message: "Missing request body.",
        },
      };
      return;
    }

    const { players = [], games = [], events = [] } = req.body;

    await saveWorkbookData({ players, games, events });

    context.res = {
      status: 204,
    };
  } catch (error) {
    context.log.error("save-data failed", error);
    context.res = {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: {
        message: "Failed to persist data to Excel.",
        detail: error.message,
      },
    };
  }
};
