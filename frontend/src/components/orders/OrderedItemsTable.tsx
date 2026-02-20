import React, { useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, Package } from 'lucide-react';
import { format } from 'date-fns';

interface OrderedItemsTableProps {
    orders: any[];
    dateRange: { start: string; end: string };
}



const OrderedItemsTable: React.FC<OrderedItemsTableProps> = ({ orders, dateRange }) => {

    const aggregatedItems = useMemo(() => {
        const itemsMap = new Map<string, number>();

        orders.forEach(order => {
            // Exclude Invalid Statuses for "Ordered Items" calculation
            if (['RETURNED', 'CANCELLED', 'DRAFT'].includes(order.status)) return;

            order.items.forEach((item: any) => {
                const productName = item.product_name || item.name;
                const quantity = Number(item.quantity);

                if (productName && quantity) {
                    const currentQty = itemsMap.get(productName) || 0;
                    itemsMap.set(productName, currentQty + quantity);
                }
            });
        });

        // Convert to array and sort alphabetically
        return Array.from(itemsMap.entries())
            .map(([name, quantity]) => ({ name, quantity }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [orders]);

    const handleExportPDF = () => {
        const doc = new jsPDF();

        // Title
        doc.setFontSize(18);
        doc.text('Ordered Items Report', 14, 22);

        // Date Info
        doc.setFontSize(11);
        doc.setTextColor(100);
        let dateText = `Generated on: ${format(new Date(), 'PPpp')}`;
        if (dateRange.start) {
            dateText += `\nFilter: ${dateRange.start} ${dateRange.end ? 'to ' + dateRange.end : ''}`;
        } else {
            dateText += `\nFilter: All Time`;
        }
        doc.text(dateText, 14, 32);

        // Table
        autoTable(doc, {
            startY: 45,
            head: [['Product Name', 'Total Quantity']],
            body: aggregatedItems.map(item => [item.name, item.quantity.toString()]),
            theme: 'grid',
            headStyles: { fillColor: [236, 72, 153] }, // Pink-500
            styles: { fontSize: 10, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { cellWidth: 40, halign: 'center' }
            }
        });

        doc.save(`ordered-items-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`);
    };

    if (aggregatedItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <Package size={48} className="mb-4 opacity-20" />
                <p>No items found for the selected criteria.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white font-bold rounded-xl hover:bg-pink-600 transition-colors shadow-lg shadow-pink-200"
                >
                    <Download size={18} />
                    Export PDF
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold">
                        <tr>
                            <th className="px-6 py-4">Product Name</th>
                            <th className="px-6 py-4 text-center">Total Quantity</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {aggregatedItems.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                                <td className="px-6 py-4 text-center font-bold text-gray-700">
                                    <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs">
                                        {item.quantity}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-bold text-gray-900">
                        <tr>
                            <td className="px-6 py-4">Total Lines</td>
                            <td className="px-6 py-4 text-center">{aggregatedItems.length}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default OrderedItemsTable;
