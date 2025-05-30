document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('/featured-products');
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) return;

    const container = document.createElement('div');
    container.className = 'featured-products';
    container.innerHTML = `<h2>Featured Products</h2><div class="featured-row"></div>`;

    const row = container.querySelector('.featured-row');

    data.forEach(p => {
      const productHTML = `
        <style>
        .featured-products {
        margin: 2em 0;
        padding: 1em;
        background: #f9f9f9;
      }

      .featured-row {
        display: flex;
        gap: 20px;
        flex-wrap: wrap;
      }

      .featured-card {
        border: 1px solid #ccc;
        padding: 10px;
        width: 200px;
        text-align: center;
        background: white;
        border-radius: 8px;
        box-shadow: 1px 1px 6px rgba(0, 0, 0, 0.1);
      }
      </style>
        <div class="featured-card">
          <img src="${p.image || '/uploads/placeholder.png'}" width="150">
          <h4>${p.name}</h4>
          <p><strong>Category:</strong> ${p.category || 'Uncategorized'}</p>
          <p><strong>Sold:</strong> ${p.sold}</p>
          <form method="POST" action="/add-to-cart">
            <input type="hidden" name="id" value="${p.id}">
            <input type="hidden" name="name" value="${p.name}">
            <input type="hidden" name="price" value="${p.price}">
            <button type="submit">Add to Cart</button>
          </form>
        </div>
      `;
      row.insertAdjacentHTML('beforeend', productHTML);
    });

    document.body.insertBefore(container, document.querySelector('script'));
  } catch (err) {
    console.error('Failed to load featured products:', err);
  }
});
