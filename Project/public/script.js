document.addEventListener('DOMContentLoaded', () => {
  const header = document.createElement('header');
  header.style.backgroundColor = '#333';
  header.style.color = 'white';
  header.style.padding = '2em';
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.position = 'relative';  // new


  const leftNav = document.createElement('nav');
  leftNav.innerHTML = `
    <a href="/products" style="color:white; margin:0 10px; text-decoration:none;">Products</a>
  `;

  const title = document.createElement('div');
  title.innerHTML = '<a href="/" style="color:white; margin:0 10px; text-decoration:none;"><h1 style="margin: 0;">🛍️ My E-Commerce Site</h1></a>';
  title.style.position = 'absolute';
  title.style.left = '50%';
  title.style.transform = 'translateX(-50%)';
  title.style.textAlign = 'center';



  const rightNav = document.createElement('nav');
  rightNav.style.textAlign = 'right';

  fetch('/session-info')
    .then(res => res.json())
    .then(data => {
      if (data.loggedIn) {
        rightNav.innerHTML = `
          <div style="position: relative; display: inline-block;">
            <button id="userButton" style="background: none; border: none; color: white; cursor: pointer; font-weight: bold;">
              👤 ${data.username} ⌄
            </button>
            <div id="userMenu" style="display: none; position: absolute; right: 0; background-color: white; color: black; min-width: 150px; box-shadow: 0 8px 16px rgba(0,0,0,0.2); z-index: 1;">
              <a href="/your-account" style="display:block; padding: 10px; text-decoration: none; color: black;">Your account</a>
              <a href="/cart" style="display:block; padding: 10px; text-decoration: none; color: black;">🛒 Cart</a>
              <a href="/orders" style="display:block; padding: 10px; text-decoration: none; color: black;">🛒 Orders</a>
              <a href="/logout" style="display:block; padding: 10px; text-decoration: none; color: black;">🚪 Logout</a>
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

        // Add admin link if username is admin
        if (data.username === 'admin') {
          leftNav.innerHTML += `
            <a href="/admin" style="color:white; margin:0 10px; text-decoration:none;">Admin</a>
          `;
        }
      } else {
        rightNav.innerHTML = `
          <a href="/login" style="color:white; margin:0 10px; text-decoration:none;">Login</a>
          <a href="/register" style="color:white; margin:0 10px; text-decoration:none;">Register</a>
        `;
      }
    })
    .catch(err => {
      rightNav.innerHTML = '<p style="color:red;">Error loading user info.</p>';
      console.error(err);
    });

  header.appendChild(leftNav);
  header.appendChild(title);
  rightNav.innerHTML += `<a href="/cart" ">🛒 Cart</a>`;
  header.appendChild(rightNav);
  document.body.insertAdjacentElement('afterbegin', header);
});


document.addEventListener('DOMContentLoaded', () => {
  // Footer HTML content
  const footerHTML = `
    <footer class="footer">
    <link rel="stylesheet" href="/footer.css">
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
      <a href="#" class="back-to-top">Back to top</a>
    </footer>
  `;

  // Insert the footer at the bottom of the page
  document.body.insertAdjacentHTML('beforeend', footerHTML);

  // Smooth scroll for "Back to Top" button
  const backToTopButton = document.querySelector('.back-to-top');
  if (backToTopButton) {
    backToTopButton.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
});







