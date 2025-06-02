document.addEventListener('DOMContentLoaded', () => {
  const header = document.createElement('header');
  header.className = 'custom-header';

  const leftNav = document.createElement('nav');
  leftNav.innerHTML = `
    <a href="/products" class="nav-link">Products</a>
    <link rel="stylesheet" href="/header.css">
  `;

  const title = document.createElement('div');
  title.innerHTML = '<a href="/"><img src="uploads/logo.png" alt="Logo" class="logo" width="125px"></a>';
  title.className = 'header-title';

  const rightNav = document.createElement('nav');
  rightNav.className = 'right-nav';

  fetch('/session-info')
    .then(res => res.json())
    .then(data => {
      if (data.loggedIn) {
        rightNav.innerHTML = `
          <div class="user-dropdown">
            <button id="userButton" class="user-button">
              👤 ${data.username} ⌄
            </button>
            <div id="userMenu" class="user-menu">
              <a href="/your-account" class="user-menu-link">Your account</a>
              <a href="/cart" class="user-menu-link">🛒 Cart</a>
              <a href="/orders" class="user-menu-link">🛒 Orders</a>
              <a href="/logout" class="user-menu-link">🚪 Logout</a>
            </div>
          </div>
        `;

        setTimeout(() => {
          const userButton = document.getElementById('userButton');
          const userMenu = document.getElementById('userMenu');

          userButton.addEventListener('click', (e) => {
            e.stopPropagation();
            userMenu.style.display = userMenu.style.display === 'block' ? 'none' : 'block';
          });

          document.addEventListener('click', () => {
            userMenu.style.display = 'none';
          });
        }, 0);

        if (data.username === 'admin') {
          leftNav.innerHTML += `
            <a href="/admin" class="nav-link">Admin</a>
          `;
        }
      } else {
        rightNav.innerHTML = `
          <a href="/login" class="nav-link">Login</a>
          <a href="/register" class="nav-link">Register</a>
        `;
      }
    })
    .catch(err => {
      rightNav.innerHTML = '<p style="color:red;">Error loading user info.</p>';
      console.error(err);
    });

  header.appendChild(leftNav);
  header.appendChild(title);
  rightNav.innerHTML += `<a href="/cart" class="nav-link">🛒 Cart</a>`;
  header.appendChild(rightNav);
  document.body.insertAdjacentElement('afterbegin', header);
});




document.addEventListener('DOMContentLoaded', () => {
  // Footer HTML content
  const footerHTML = `
    <footer class="footer">
    <link rel="stylesheet" href="/footer.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap" rel="stylesheet">
      <div class="footer-container">
        <div class="footer-column">
          <h3>About Us</h3>
          <ul>
            <li><a href="#">Our Story</a></li>
            <li><a href="#">Team</a></li>
            <li><a href="#">Careers</a></li>
            <li><a href="#">Contact Us</a></li>
          </ul>
        </div>
        <div class="footer-column">
          <h3>Services</h3>
          <ul>
            <li><a href="#">Shop</a></li>
            <li><a href="#">Track Orders</a></li>
            <li><a href="#">Affiliate Program</a></li>
            <li><a href="#">Customer Support</a></li>
          </ul>
        </div>
        <div class="footer-column">
          <h3>Legal</h3>
          <ul>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms & Conditions</a></li>
            <li><a href="#">Refund Policy</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>My E-Commerce Site | English | USD</span>
      </div>
    </footer>
  `;

  // Insert the footer at the bottom of the page
  document.body.insertAdjacentHTML('beforeend', footerHTML);

});
