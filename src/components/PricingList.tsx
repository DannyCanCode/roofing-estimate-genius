import React, { useState } from 'react';

const initialPricingData = [
  { name: 'Remove, Haul and dispose of existing material', retail: 0.00, unit: 'SQ' },
  { name: 'Re-Nail the decking and trusses Per FL Building Code', retail: 0.00, unit: 'EA' },
  { name: 'GAF Timberline HDZ SG', retail: 152.10, unit: 'SQ' },
  // ... add all other items here ...
];

export function PricingList() {
  const [pricingData, setPricingData] = useState(initialPricingData);

  const handlePriceChange = (index, newPrice) => {
    const updatedData = [...pricingData];
    updatedData[index].retail = newPrice;
    setPricingData(updatedData);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2">Item</th>
            <th className="py-2">Retail Price</th>
            <th className="py-2">Unit</th>
          </tr>
        </thead>
        <tbody>
          {pricingData.map((item, index) => (
            <tr key={index} className="border-b">
              <td className="py-2 px-4">{item.name}</td>
              <td className="py-2 px-4">
                <input
                  type="number"
                  value={item.retail}
                  onChange={(e) => handlePriceChange(index, parseFloat(e.target.value))}
                  className="w-full border rounded px-2"
                />
              </td>
              <td className="py-2 px-4">{item.unit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 