import ExcelJS from "exceljs";
import { saveAs } from 'file-saver';
import { Product } from "../interfaces/Product";

function daysUntilExpiry(expiryDate: string | number) {
    if (expiryDate === "No expira") return "No vence";
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return daysLeft < 0 ? "Vencido" : daysLeft;
}

export async function exportToExcel(products: any[], fileName = "Productos.xlsx") {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Productos');

    // Helper function to parse dates
    const parseDate = (dateString: string) => {
        if (dateString === "N/A" || dateString === "No expira") return '';
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? '' : date;
    };

    // Compute formatted data
    const formattedData = products.map((p) => ({
        Nombre: p.name,
        Descripción: p.description,
        Cantidad: Number(p.quantity),
        "Fecha de compra": p.purchaseDate || "N/A",
        "Fecha de vencimiento": p.expiryDate || "No expira",
        Costo: Number(p.cost),
        "Vence en": daysUntilExpiry(p.expiryDate),
    }));

    // Define headers and column widths
    worksheet.columns = [
        { header: 'Nombre', key: 'Nombre', width: 20 },
        { header: 'Descripción', key: 'Descripción', width: 22 },
        { header: 'Cantidad', key: 'Cantidad', width: 14 },
        { header: 'Fecha de compra', key: 'Fecha de compra', width: 20 },
        { header: 'Fecha de vencimiento', key: 'Fecha de vencimiento', width: 25 },
        { header: 'Costo', key: 'Costo', width: 11 },
        { header: 'Vence en', key: 'Vence en', width: 14 }
    ];

    // Add rows one by one with special handling for dates
    formattedData.forEach((item, index) => {
        const rowNumber = index + 2; // header is row 1
        const row = worksheet.addRow([
            item.Nombre,
            item.Descripción,
            item.Cantidad,
            null, // placeholder for purchase date
            null, // placeholder for expiry date
            item.Costo,
            item["Vence en"]
        ]);

        // Purchase Date
        const purchaseCell = worksheet.getCell(`D${rowNumber}`);
        if (item["Fecha de compra"] === "N/A") {
            purchaseCell.value = "N/A";
        } else {
            const parsed = parseDate(item["Fecha de compra"]);
            if (parsed) {
                purchaseCell.value = parsed;
                purchaseCell.numFmt = 'dd/mm/yyyy';
            } else {
                purchaseCell.value = "N/A";
            }
        }

        // Expiry Date
        const expiryCell = worksheet.getCell(`E${rowNumber}`);
        if (item["Fecha de vencimiento"] === "No expira") {
            expiryCell.value = "No vence";
        } else {
            const parsed = parseDate(item["Fecha de vencimiento"]);
            if (parsed) {
                expiryCell.value = parsed;
                expiryCell.numFmt = 'dd/mm/yyyy';
            } else {
                expiryCell.value = "No vence";
            }
        }
    });

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.alignment = { horizontal: 'center' };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F2F2F2' }
        };
    });

    // Conditional formatting
    for (let i = 2; i <= formattedData.length + 1; i++) {
        const row = worksheet.getRow(i);
        const days = formattedData[i - 2]["Vence en"];
        let applyStrike = false;
        let fillColor: string | null = null;

        if (days == "Vencido") {
            fillColor = 'A6A6A6'; // Gray
            applyStrike = true;
        } else if (typeof (days) === 'number' && days <= 7) {
            fillColor = 'FF0000'; // Red
        } else if (typeof (days) === 'number' && days <= 14) {
            fillColor = 'FFFF00'; // Yellow
        }

        row.eachCell((cell) => {
            cell.alignment = { horizontal: 'left' };
            if (fillColor) {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: fillColor }
                };
            }
            if (applyStrike) {
                cell.font = { ...cell.font, strike: true };
            }
        });
    }

    // Enable autofilter
    worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: worksheet.columns.length }
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    saveAs(blob, fileName);
}

export async function importFromExcel(file: File): Promise<{ products: Product[]; failedCount: number }> {
    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = await file.arrayBuffer();
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.getWorksheet(1); // Get the first worksheet
    if (!worksheet) {
        throw new Error("No worksheet found in the Excel file");
    }

    const products: Product[] = [];
    let failedCount = 0;

    // --- Header detection logic ---
    // Read the first row's cell values
    const firstRow = worksheet.getRow(1);
    const firstRowValues = [
        firstRow.getCell(1).text.trim().toLowerCase(),
        firstRow.getCell(2).text.trim().toLowerCase(),
        firstRow.getCell(3).text.trim().toLowerCase(),
        firstRow.getCell(4).text.trim().toLowerCase(),
        firstRow.getCell(5).text.trim().toLowerCase(),
        firstRow.getCell(6).text.trim().toLowerCase(),
    ];

    // Define your expected headers (add more variants if needed)
    const expectedHeaders = [
        "name",         // or "nombre"
        "description",  // or "descripción"
        "quantity",     // or "cantidad"
        "purchase date",// or "fecha de compra"
        "expiry date",  // or "fecha de vencimiento"
        "cost"          // or "costo"
    ];

    // Simple header detection: check if at least 3 columns match expected headers
    const headerMatchCount = expectedHeaders.reduce((count, header, idx) => {
        return count + (firstRowValues[idx].includes(header) ? 1 : 0);
    }, 0);

    const hasHeader = headerMatchCount >= 3; // You can adjust the threshold

    // Iterate over each row, conditionally skipping the first row if it's a header
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        // Skip the first row only if it's a header
        if (hasHeader && rowNumber === 1) return;

        try {
            // Get values from the row
            const name = row.getCell(1).text.trim();
            const description = row.getCell(2).text.trim();
            const quantityCell = row.getCell(3);
            const purchaseDateCell = row.getCell(4);
            const expiryDateCell = row.getCell(5);
            const costCell = row.getCell(6);

            // Skip products without a name
            if (!name) {
                failedCount++;
                return;
            }

            // Parse quantity (default to 0 if missing)
            let quantity = 0;
            if (!quantityCell.text.trim()) {
                quantity = 0;
            } else {
                quantity = Number(quantityCell.value) || 0;
            }

            // Parse purchase date (default to "N/A" if missing)
            let purchaseDate = "N/A";
            if (purchaseDateCell.text.trim()) {
                if (purchaseDateCell.text === "N/A") {
                    purchaseDate = "N/A";
                } else if (purchaseDateCell.value instanceof Date) {
                    purchaseDate = purchaseDateCell.value.toISOString().split("T")[0];
                } else {
                    purchaseDate = purchaseDateCell.text;
                }
            }

            // Parse expiry date (default to "No expira" if missing)
            let expiryDate = "No expira";
            if (expiryDateCell.text.trim()) {
                if (expiryDateCell.text === "No vence" || expiryDateCell.text === "No expira") {
                    expiryDate = "No expira";
                } else if (expiryDateCell.value instanceof Date) {
                    expiryDate = expiryDateCell.value.toISOString().split("T")[0];
                } else {
                    expiryDate = expiryDateCell.text;
                }
            }

            // Parse cost (default to 0 if missing)
            let cost = 0;
            if (!costCell.text.trim()) {
                cost = 0;
            } else {
                cost = Number(costCell.value) || 0;
            }

            // Create a new product
            const product: Product = {
                id: Date.now() + products.length, // Generate a unique ID
                name,
                description,
                quantity,
                purchaseDate,
                expiryDate,
                cost,
            };

            products.push(product);
        } catch (error) {
            // If any error occurs during parsing, increment the failed count
            failedCount++;
        }
    });

    return { products, failedCount };
}