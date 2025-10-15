import React from 'react';

function AdminToolbar() {
  return (
    <section className="admin-toolbar flex flex-wrap gap-2 my-2" aria-label="Admin actions">
      <button className="chip px-3 py-2 rounded-full border border-brand/35 bg-[#0e1830] text-white">Dashboard</button>
      <button className="chip px-3 py-2 rounded-full border border-brand/35 bg-[#0e1830] text-white">POS</button>
      <button className="chip px-3 py-2 rounded-full border border-brand/35 bg-[#0e1830] text-white">Inventory</button>
      <button className="chip px-3 py-2 rounded-full border border-brand/35 bg-[#0e1830] text-white">Orders</button>
      <button className="chip px-3 py-2 rounded-full border border-brand/35 bg-[#0e1830] text-white">Service Tickets</button>
      <button className="chip px-3 py-2 rounded-full border border-brand/35 bg-[#0e1830] text-white">Users & Roles</button>
    </section>
  );
}

export default AdminToolbar;


