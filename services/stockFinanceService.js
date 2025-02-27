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

export const getFinanceInfoByCategory = async (periods, type, category_id, report_component) => {
  const table = type === "YEAR" ? "stock_finance_infor" : "stock_finance_infor_quarter";
  const field = type === "YEAR" ? "year_period" : "quarter_period";
  const periodsQuery = periods.map((e) => `SUM(CASE WHEN ${field} = '${e}' THEN value ELSE 0 END) AS "${e}"`).join(",");

  const stringQuery = `
  WITH stock_codes AS (
    SELECT 
      s.stock_code
    FROM stocks s
    WHERE s.category_id = ${category_id}
  ),
  stock_finance AS (
    SELECT
      stock_code, 
      report_type_name,
      report_component_name,
      report_component_code,
      ${periodsQuery},
      order_type,
      order_component,
      row_number
    FROM ${table}
    WHERE report_component_code = '${report_component}'
    GROUP BY stock_code, report_type_name, report_component_name, report_component_code, order_type, row_number, order_component
    ORDER BY order_type, order_component, row_number
  )
  SELECT *
  FROM stock_codes sc
  JOIN stock_finance sf ON sc.stock_code = sf.stock_code
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
