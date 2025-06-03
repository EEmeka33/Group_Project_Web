document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('/featured-products');
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) return;

    const container = document.createElement('div');
    container.className = 'featured-products';
    container.innerHTML = `<h2>Featured Products</h2><div class="featured-row"></div>`;

    const row = container.querySelector('.featured-row');

    data.forEach((p, index) => {
      const delay = index * 100; // 100ms delay between cards
      const productHTML = `

        <div class="card">
        <div class="card-header">
        <a href="/product/${p.id}" style=" text-decoration: none;  color: inherit;" >
        <h3>${p.name}</h3>
      <p><strong>Category:</strong> ${p.category || 'Uncategorized'}</p>
    </div>
      <div class="card-image">
        <img src="${p.image || '/uploads/placeholder.png'}" width="150">
      </div>
      <div class="card-description">
        <p>${p.description || 'No description'}</p>
      </div>
      <div class="card-footer">
        <p><strong>Price:</strong> $${p.price}</p>
        <form method="POST" action="/add-to-cart">
          <input type="hidden" name="id" value="${p.id}">
            <input type="hidden" name="name" value="${p.name}">
              <input type="hidden" name="price" value="${p.price}">
                <button type="submit">Add to Cart</button>
        </form>
      </a>
    </div>
    </div>
    `;
      row.insertAdjacentHTML('beforeend', productHTML);
    });


    const target = document.getElementById('featured-products');
    if (target) target.appendChild(container);

  } catch (err) {
    console.error('Failed to load featured products:', err);
  }
});
