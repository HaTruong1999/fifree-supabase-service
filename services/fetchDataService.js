import supabase from "../config/supabaseClient.js";
import axios from "axios";

const finance_vietstock_infor = {
  financeinfo_url: "https://finance.vietstock.vn/data/financeinfo",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
    Cookie: "",
  },
  token: "u97V5MDVjMmxD7si_e2pzJ0lfmeOKsOx-KZwEOJ4NPkJWC0Qndue4BUnK_2_empUG8IBetmtooq05Lk_SheFB8h_JKB_7EC4b3uazeiNeuA1",
};

const fetchFIFromFVByStock = async (stockCode, page, reportType, fvToken, fvCookie) => {
  const reportTermType = reportType === "YEAR" ? "1" : "2";
  const url = "https://finance.vietstock.vn/data/financeinfo";

  const formData = new URLSearchParams();
  formData.append("Code", stockCode);
  formData.append("Page", page);
  formData.append("PageSize", "2");
  formData.append("ReportTermType", reportTermType);
  formData.append("ReportType", "BCTQ");
  formData.append("Unit", "1000000");
  formData.append("__RequestVerificationToken", fvToken);

  if (fvCookie) finance_vietstock_infor.headers.Cookie = fvCookie;

  try {
    const { data } = await axios.post(url, formData, {
      headers: finance_vietstock_infor.headers,
    });

    if (data) {
      const headers = data[0].map((e) => {
        const item = {
          stock_code: stockCode,
          year_period: e.YearPeriod.toString(),
          period_begin: e.PeriodBegin,
          period_end: e.PeriodEnd,
          term_name: e.TermName,
          term_name_en: e.TermNameEN,
        };

        if (reportTermType === "2") item.quarter_period = `${e.TermNameEN.split(" ")[1]}/${e.YearPeriod.toString()}`;

        return item;
      });

      const reversedHeader = headers.reverse();

      const resultList = [];
      const reportData = data[1];

      for (const component in reportData) {
        reportData[component].forEach((ic) => {
          reversedHeader.forEach((header, index) => {
            const item = {
              ...header,
              report_type_name: ic.Name,
              report_type_name_en: ic.NameEn,
              report_component_name: ic.ReportComponentName,
              report_component_code: ic.ReportComponentNameEn,
              rp_name_mobile: ic.NameMobile,
              rp_name_mobile_en: ic.NameMobileEn,
              order_type: ic.OrderType,
              order_component: ic.OrderingComponent,
              row_number: ic.RowNumber,
              value: ic[`Value${index + 1}`] ? ic[`Value${index + 1}`] : 0,
            };

            resultList.push(item);
          });
        });
      }

      return resultList;
    } else {
      return null;
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getFinanceInfoFromFinanceVietstock = async (stocks, page, type, fvToken, fvCookie) => {
  try {
    let resultData = [];

    for (let i = 0; i < stocks.length; i++) {
      const data = await fetchFIFromFVByStock(stocks[i], page, type, fvToken, fvCookie);
      if (data.length > 0) resultData = [...resultData, ...data];
    }

    return resultData;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const doSyncFinanceInfoFromFinanceVietstock = async (stocks, page, type, fvToken, fvCookie) => {
  try {
    let resultData = [];

    for (let i = 0; i < stocks.length; i++) {
      const data = await fetchFIFromFVByStock(stocks[i], page, type, fvToken, fvCookie);
      if (data.length > 0) resultData = [...resultData, ...data];
    }

    if (resultData.length > 0) {
      const addData = await addListStockFinanceInfor(resultData, type);
      return addData;
    } else return null;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getFinanceInfoByStock = async (stock, periods, type) => {
  const table = type === "YEAR" ? "stock_finance_infor" : "stock_finance_infor_quarter";
  const field = type === "YEAR" ? "year_period" : "quarter_period";
  const periodsQuery = periods.map((e) => `SUM(CASE WHEN ${field} = '${e}' THEN value ELSE 0 END) AS "${e}"`).join(",");

  const stringQuery = `
    SELECT 
      report_type_name,
      report_component_name,
      ${periodsQuery},
      order_type,
      order_component,
      row_number
    FROM ${table}
    WHERE stock_code = '${stock}' 
    GROUP BY report_type_name, report_component_name, order_type, row_number, order_component
    ORDER BY order_type, order_component, row_number
  `;

  const { data, error } = await supabase.rpc("execute_sql", { query: stringQuery });

  if (error) throw new Error(error.message);
  return data;
};

export const addListStockFinanceInfor = async (arrayInput, type) => {
  const tableUpdate = type === "YEAR" ? "stock_finance_infor" : "stock_finance_infor_quarter";

  const { data, error } = await supabase.from(tableUpdate).insert(arrayInput);

  if (error) throw new Error(error.message);
  return data;
};

// backup function

const fetchFIFromFVByStock_Old = async (stockCode, page, reportType) => {
  const reportTermType = reportType === "YEAR" ? "1" : "2";
  const url = "https://finance.vietstock.vn/data/financeinfo";

  const formData = new URLSearchParams();
  formData.append("Code", stockCode);
  formData.append("Page", page);
  formData.append("PageSize", "2");
  formData.append("ReportTermType", reportTermType);
  formData.append("ReportType", "BCTQ");
  formData.append("Unit", "1000000");
  formData.append("__RequestVerificationToken", finance_vietstock_infor.token);

  try {
    const response = await axios.post(url, formData, {
      headers: finance_vietstock_infor.headers,
    });

    const { data } = response;

    if (data) {
      const headers = data[0].map((e) => {
        return {
          stock_code: stockCode,
          year_period: e.YearPeriod.toString(),
          period_begin: e.PeriodBegin,
          period_end: e.PeriodEnd,
        };
      });

      const isOriginalData = data[1]["Kết quả kinh doanh"];
      const incomeStatements = [];

      const bsOriginalData = data[1]["Cân đối kế toán"];
      const balanceSheet = [];

      const rOriginalData = data[1]["Chỉ số tài chính"];
      const ratios = [];

      headers.reverse().forEach((e, index) => {
        // income statements
        let income1, income2, income3, income4, income5;

        isOriginalData.forEach((item) => {
          if (item.Name === "Doanh thu thuần") {
            income1 = item;
          } else if (item.Name === "LN gộp") {
            income2 = item;
          } else if (item.Name === "LN thuần từ HĐKD") {
            income3 = item;
          } else if (item.Name === "LNST thu nhập DN") {
            income4 = item;
          } else if (item.Name === "LNST của CĐ cty mẹ") {
            income5 = item;
          }
        });

        const itemIS = {
          ...e,
          net_revenue: income1 ? income1[`Value${index + 1}`] : 0,
          gross_profit: income2 ? income2[`Value${index + 1}`] : 0,
          business_profit: income3 ? income3[`Value${index + 1}`] : 0,
          after_tax_profit: income4 ? income4[`Value${index + 1}`] : 0,
          parent_after_tax_profit: income5 ? income5[`Value${index + 1}`] : 0,
        };

        incomeStatements.push(itemIS);

        // balance sheet
        let b1, b2, b3, b4, b5;

        bsOriginalData.forEach((item) => {
          if (item.Name === "Tài sản ngắn hạn") {
            b1 = item;
          } else if (item.Name === "Tổng cộng tài sản") {
            b2 = item;
          } else if (item.Name === "Nợ phải trả") {
            b3 = item;
          } else if (item.Name === "Nợ ngắn hạn") {
            b4 = item;
          } else if (item.Name === "Vốn chủ sở hữu") {
            b5 = item;
          }
        });

        const itemBS = {
          ...e,
          short_term_assets: b1 ? b1[`Value${index + 1}`] : 0,
          total_assets: b2 ? b2[`Value${index + 1}`] : 0,
          debt: b3 ? b3[`Value${index + 1}`] : 0,
          short_term_debt: b4 ? b4[`Value${index + 1}`] : 0,
          equity: b5 ? b5[`Value${index + 1}`] : 0,
        };

        balanceSheet.push(itemBS);

        // ratios
        let r1, r2, r3, r4, r5, r6;

        rOriginalData.forEach((item) => {
          if (item.Name === "EPS 4 quý") {
            r1 = item;
          } else if (item.Name === "BVPS cơ bản") {
            r2 = item;
          } else if (item.Name === "P/E cơ bản") {
            r3 = item;
          } else if (item.Name === "ROS") {
            r4 = item;
          } else if (item.Name === "ROEA") {
            r5 = item;
          } else if (item.Name === "ROAA") {
            r6 = item;
          }
        });

        const itemR = {
          ...e,
          eps: r1 ? r1[`Value${index + 1}`] : 0,
          bvps: r2 ? r2[`Value${index + 1}`] : 0,
          pe: r3 ? r3[`Value${index + 1}`] : 0,
          ros: r4 ? r4[`Value${index + 1}`] : 0,
          roea: r5 ? r5[`Value${index + 1}`] : 0,
          roaa: r6 ? r6[`Value${index + 1}`] : 0,
        };

        ratios.push(itemR);
      });

      return {
        incomeStatements,
        balanceSheet,
        ratios,
      };
    } else {
      return null;
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

export const doSyncFinanceInfoFromFinanceVietstock_Old = async (stocks) => {
  try {
    let incomeStatementList = [];
    let balanceSheetList = [];
    let ratiosList = [];

    for (let i = 0; i < stocks.length; i++) {
      const data = await fetchFIFromFVByStock_Old(stocks[i], 1, "YEAR");
      const { incomeStatements, balanceSheet, ratios } = data;

      if (incomeStatements.length > 0) incomeStatementList = [...incomeStatementList, ...incomeStatements];
      if (balanceSheet.length > 0) balanceSheetList = [...balanceSheetList, ...balanceSheet];
      if (ratios.length > 0) ratiosList = [...ratiosList, ...ratios];
    }

    return { income_statement: incomeStatementList, balance_sheet: balanceSheetList, ratios: ratiosList };
  } catch (error) {
    throw new Error(error.message);
  }
};
