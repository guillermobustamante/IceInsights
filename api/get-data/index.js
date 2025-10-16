const { getWorkbookData } = require("../lib/excelRepository");

module.exports = async function run(context, req) {
  try {
    const data = await getWorkbookData();
    context.res = {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: data,
    };
  } catch (error) {
    context.log.error("get-data failed", error);
    context.res = {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: {
        message: "Failed to load data from Excel.",
        detail: error.message,
      },
    };
  }
}; 
//End of file: api/get-data/index.js