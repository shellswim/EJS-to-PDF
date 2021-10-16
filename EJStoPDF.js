const puppeteer = require('puppeteer');
const ejs = require('ejs');
const fs = require('fs');

exports.EJStoPDF = async function(options) {

    options = this.parse(options);

    const response = new Object();
    const dir = __dirname + '/../../../' + '/views';
    const pubdir = __dirname + '/../../../' + '/public';
    const FolderPath = pubdir + options.folderName;
    const FilePath = pubdir + options.folderName +'/'+ options.fileName + '.pdf';
    const downloadPath = options.folderName + '/' + options.fileName + '.pdf';

    
    /////////////// SETUP PUPPETEER PAGE CONFIGS
    const pdfConfigs = {};

    pdfConfigs.path = FilePath;
    pdfConfigs.scale = options.webscale;
    pdfConfigs.printBackground = options.printbackground === "true" ? true : false;

    if(options.headerTemplate || options.footerTemplate) { 
        pdfConfigs.headerTemplate = options.headerTemplate;  
        pdfConfigs.footerTemplate = options.footerTemplate;
        pdfConfigs.displayHeaderFooter = true;
    }

    if(options.orientation == 'p') {
        pdfConfigs.landscape = false;
    } else {
        pdfConfigs.landscape = true;
    }

    if(options.papersize == 'Custom') {
        pdfConfigs.width = options.pageWidth;
        pdfConfigs.height = options.pageHeight;
    } else {
        pdfConfigs.format = options.papersize;
    }
    pdfConfigs.margin = {
        top: options.topMargin + 'mm',
        right: options.rightMargin + 'mm',
        bottom: options.bottomMargin + 'mm',
        left: options.leftMargin + 'mm'
    } 
    ////////////// END PAGE CONFIGS

    // check the temp folder exists
    if(!fs.existsSync(FolderPath)) {
        fs.mkdirSync(FolderPath);
    }

    // fs.writeFileSync(FolderPath + '/json.txt', JSON.stringify(options.printbackground));
    
    // get JSON data for EJS template
    let api_json = await this.parse(options.jsonresponse);

    // render EJS template and return html string.
    let html = await ejs.renderFile(dir+options.tempPath, {data: api_json, host: options.hostname});
    
    // start puppeteer
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    // set html content
    await page.setContent(html, {
        waitUntill: 'networkidle2'
    });

    // make sure fonts have loaded before screenshot and pdf generation
    await page.evaluateHandle('document.fonts.ready');
    await page.screenshot();

    // generate PDF with configs
    await page.pdf(pdfConfigs);

    // end Puppeteer session.
    await page.close();
    await browser.close();
    
    // Get final path of generated PDF
    response.downloadPath = downloadPath;

    // Return path & filename of PDF for download.
    return response;
}