const fs = require('fs');

function fixReportQueryError(filePath, searchStr, replacementStr) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(searchStr, replacementStr);
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${filePath}`);
}

const reportFile = 'components/reports/GenericAuditReport.tsx';
const reportSearch = `const { data: tableData } = await tableQuery.catch(() => ({ data: [] })); // table might not have correct schema`;
const reportReplace = `let tableData = [];
      try {
        const result = await tableQuery;
        if (result && result.data) {
          tableData = result.data;
        }
      } catch (e) {
        console.warn('Fallback table fetch failed', e);
      }`;
fixReportQueryError(reportFile, reportSearch, reportReplace);


const pagePath = 'app/dashboard/reports/page.tsx';
const pageSearch = `const { data: tableData } = await tableQuery.catch(() => ({ data: null }));`;
const pageReplace = `let tableData = null;
        try {
          const result = await tableQuery;
          if (result && result.data) {
            tableData = result.data;
          }
        } catch (e) {
          console.warn('Fallback table fetch failed', e);
        }`;
fixReportQueryError(pagePath, pageSearch, pageReplace);
