import * as XLSX from "xlsx";

function daysUntilExpiry(expiryDate: string | number) {
    if (expiryDate === "No expira") return "No vence";
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return daysLeft < 0 ? "Vencido" : daysLeft;
}

export function exportToExcel(products: any[], fileName = "Productos.xlsx") {
    const formattedData = products.map((p) => ({
        Nombre: p.name,
        Descripción: p.description,
        Cantidad: p.quantity,
        "Fecha de compra": p.purchaseDate,
        "Fecha de vencimiento": p.expiryDate,
        Costo: p.cost,
        "Vence en": daysUntilExpiry(p.expiryDate),
    }));

    const headers = Object.keys(formattedData[0]);

    const ws = XLSX.utils.json_to_sheet([]);
    XLSX.utils.sheet_add_aoa(ws, [headers], { origin: "A1" });
    XLSX.utils.sheet_add_json(ws, formattedData, { origin: "A2", skipHeader: true });

    // Bold header styling
    headers.forEach((_, colIndex) => {
        const cellRef = XLSX.utils.encode_cell({ c: colIndex, r: 0 });
        const cell = ws[cellRef];
        if (cell) {
            cell.s = {
                font: { bold: true },
                alignment: { horizontal: "center" },
            };
        }
    });

    const range = XLSX.utils.decode_range(ws["!ref"]!);

    for (let R = 1; R <= range.e.r; ++R) {
        for (let C = 0; C < headers.length; ++C) {
            const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
            if (cell && (cell.s?.font?.strike !== true)) {
                cell.s = {
                    ...cell.s,
                    alignment: { horizontal: "left" },
                };
            }
        }
    }

    const costoColIndex = headers.indexOf("Costo");

    for (let R = 1; R <= range.e.r; ++R) {
        const cell = ws[XLSX.utils.encode_cell({ r: R, c: costoColIndex })];
        if (cell && typeof cell.v === "number") {
            cell.t = "n"; // numeric type
            cell.z = '"$"#,##0.00'; // currency format (can adjust)
        }
    }

    ws["!autofilter"] = {
        ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }),
    };

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Productos");

    XLSX.writeFile(wb, fileName, { bookType: "xlsx", cellStyles: true });
}