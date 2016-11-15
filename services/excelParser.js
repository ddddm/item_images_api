'use strict';
var xlsx = require('xlsx');
var encoding = require("encoding");
const excelColumnName = require('excel-column-name')
var Promise = require('bluebird');
var _ = require('lodash');
const logger = require('debug')('vitekApi:excelParser');
var lowercaseFileExtension = require('./lowercaseFileExtension');


const headers = [
    {
        header: 'Картинка',
        prop: 'image_file'
    },
    {
        header: 'ТМЦ',
        prop: 'name'
    },
    {
        header: 'Хар-ка',
        prop: 'description'
    }
]

function getCellAddress(row, column) {
    return [
        excelColumnName.intToExcelCol(column),
        row
    ].join('')
}

function parseItemObject(itemObj) {
    var item = {
        valid: true
    };

    if(itemObj.code) {
        item.code = parseInt(itemObj.code);
    } else {
        item.valid = false;
    }

    if(itemObj.name && _.isString(itemObj.name)) {
        item.name = itemObj.name;
    } else {
        item.valid = false;
    }

    if(itemObj.image_file) {
        item.image_file = _.toString(itemObj.image_file);
    }

    if(itemObj.description && _.isString(itemObj.description)) {
        item.description = itemObj.description;
    }

    if(item.valid) {
        item.image_file = lowercaseFileExtension(item.image_file);
    }

    return item;
}

function isSheetEnded(row, sheet) {
    const column = 1;
    const currentCell = getCellAddress(row, column)
    const nextCell = getCellAddress(row + 1, column)

    return sheet[currentCell] || (
            !sheet[currentCell] &&
            sheet[nextCell]
        );
}

function findSheetHeader(sheet) {
    const rowLimit = 25;
    const columnLimit = 25;

    let headersPositions = [];

    for(let row = 1; row < rowLimit; row++) {
        for(let column = 1; column < columnLimit; column++) {

            const cellAddress = getCellAddress(row, column)

            _.each(headers, (headerObj) => {

                if(
                    sheet[cellAddress] &&
                    sheet[cellAddress].v === headerObj.header
                ) {
                    headersPositions.push({
                        header: headerObj.header,
                        prop: headerObj.prop,
                        row,
                        column
                    })
                }
            })

        }
    }

    return headersPositions
}

module.exports = {
    /**
     * Parse excel document with column names in first row
     * @param fileName - full path to the local file
     * @returns {Promise}
     */
    parse: function(fileName) {
        return new Promise(function (resolve, reject) {
            var wb = xlsx.readFile(fileName);
            var sheet = wb.Sheets[wb.SheetNames[0]];
            var array = xlsx.utils.sheet_to_row_object_array(sheet,{raw:true});

            var items = _.map(array, function(itemObj) {
                return parseItemObject(itemObj);
            });

            resolve(items);
        });
    },
    /**
     * Parse pricelist
     * @param fileName
     * @returns {Promise}
     */
    parsePricelist: function (fileName, documentType) {
        return new Promise(function(resolve, reject) {
            var wb = xlsx.readFile(fileName, {cellStyles: true});
            var sheet = wb.Sheets[wb.SheetNames[0]];

            var result = [];
            documentType = {
                startFromRow: 10,
                columns: {
                    'A': 'code',
                    'D': 'name',
                    'E': 'description',
                    'J': 'image_file'
                }
            };


            for(
                var i = documentType.startFromRow;
                sheet['A' + (i).toString()] || (
                    !sheet['A' + (i).toString()] &&
                    sheet['A' + (i + 1).toString()]
                );
                i++) {

                var item = {};
                _.each(documentType.columns, function(column, symbol) {
                    if(sheet[symbol + i.toString()]) {
                        // var resultBuffer = encoding.convert(sheet[symbol + i.toString()].v, 'utf8', 'cp1251');
                        // item[column] = resultBuffer.toString('utf8');
                        item[column] = sheet[symbol + i.toString()].v;
                    }
                });

                item = parseItemObject(item);
                if(item.valid) result.push(item);
            }

            resolve(result);
        })
    },

    /**
     * Parse pricelist
     * @param fileName
     * @returns {Promise}
     */
    parseAutodetectHeaders: function (fileName) {
        return new Promise(function(resolve, reject) {
            var wb = xlsx.readFile(fileName, {cellStyles: true});
            var sheet = wb.Sheets[wb.SheetNames[0]];

            const headers = findSheetHeader(sheet);
            const startFromRow = headers[0]? headers[0].row + 1 : null;

            // if(!startFromRow || !headers) return [];

            logger('Found headers', headers)

            var result = [];

            for(
                var row = startFromRow;
                isSheetEnded(row, sheet);
                row++
            ) {
                
                let item = {};

                // add code to the item; it doesn't added to 'headers' array
                // because it has no header, but always exists in column 1;
                const codeCellAddress = getCellAddress(row, 1);

                item.code = sheet[codeCellAddress]? sheet[codeCellAddress].w : undefined

                _.each(
                    headers,
                    (header) => {
                        const cellAddress = getCellAddress(row, header.column);

                        if(sheet[cellAddress]) {
                            // var resultBuffer = encoding.convert(sheet[symbol + i.toString()].v, 'utf8', 'cp1251');
                            // item[column] = resultBuffer.toString('utf8');
                            item[header.prop] = sheet[cellAddress].w;
                        }
                });

                item = parseItemObject(item);
                if(item.valid) result.push(item);
            }

            logger(`Processed ${row} rows`)
            logger(`Parsed  ${result.length} items`)

            resolve(result);
        })
    },

    findSheetHeader
};
