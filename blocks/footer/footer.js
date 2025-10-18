export default function decorate(block) {
  // Create the footer structure to match the EJS template
  const footerHTML = `
    <div class='cmp-experiencefragment'>
      <div class='cmp-container container'>
        <div class="footer-grid">
          <!-- Left Column -->
          <div class="footer-left">
            <form class='newsletter' method="post" aria-label="Newsletter signup">
              <label for="newsletter-email">Get the latest deals and more</label>
              <div class='newsletter__form mt-4'>
                <input type='email' id="newsletter-email" name="email" placeholder='Enter email address' required />
                <button type="submit" class="btn">Sign up</button>
              </div>
            </form>

            <div class='social'>
              <small class="text-social">Follow us at:</small>
              <nav aria-label="Social media">
                <ul class='social__icons p-0 m-0'>
                  <li>
                    <a href="./" target="_blank" aria-label="Follow us on Facebook (open a new window)">
                      <img src="/icons/social/icon-facebook.svg" alt="" width="40" height="40">
                    </a>
                  </li>
                  <li>
                    <a href="./" target="_blank" aria-label="Follow us on Twitter (open a new window)">
                      <img src="/icons/social/icon-x.svg" alt="" width="40" height="40">
                    </a>
                  </li>
                  <li>
                    <a href="./" target="_blank" aria-label="Follow us on Discord (open a new window)">
                      <img src="/icons/social/icon-discord.svg" alt="" width="40" height="40">
                    </a>
                  </li>
                  <li>
                    <a href="./" target="_blank" aria-label="Follow us on YouTube (open a new window)">
                      <img src="/icons/social/icon-youtube.svg" alt="" width="40" height="40">
                    </a>
                  </li>
                  <li>
                    <a href="./" target="_blank" aria-label="Follow us on Twitch (open a new window)">
                      <img src="/icons/social/icon-twitch.svg" alt="" width="40" height="40">
                    </a>
                  </li>
                  <li>
                    <a href="./" target="_blank" aria-label="Follow us on Instagram (open a new window)">
                      <img src="/icons/social/icon-instagram.svg" alt="" width="40" height="40">
                    </a>
                  </li>
                  <li>
                    <a href="./" target="_blank" aria-label="Follow us on TikTok (open a new window)">
                      <img src="/icons/social/icon-tiktok.svg" alt="" width="40" height="40">
                    </a>
                  </li>
                  <li>
                    <a href="./" target="_blank" aria-label="Follow us on Threads (open a new window)">
                      <img src="/icons/social/icon-thread.svg" alt="" width="40" height="40">
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          </div>

          <!-- Right Column -->
          <div class="footer-right">
            <nav class='footer-links' aria-label="Footer Navigation">
              <ul class='footer-links__column pl-0'>
                <li><p class="w-500">Shop</p></li>
                <li><a href='#'>All Desktops</a></li>
              </ul>
              <ul class='footer-links__column pl-0'>
                <li><p class="w-500">Support</p></li>
                <li><a href='#'>Help Me Choose</a></li>
                <li><a href='#'>Contact Us</a></li>
                <li><a href='#'>Shopping FAQs</a></li>
              </ul>
              <ul class='footer-links__column pl-0'>
                <li><p class="w-500">Support</p></li>
                <li><a href='#'>Help Me Choose</a></li>
                <li><a href='#'>Education & Commercial Inquiries</a></li>
              </ul>
            </nav>
          </div>
        </div>

        <div class='footer-bottom'>
          <span><img src="/icons/Global.svg" alt="Global">Global / English</span>
          <nav class='footer-bottom__links' aria-label="Legal links">
            <a href='#' target="_blank" aria-label="View Privacy Policy (open a new window)">Privacy Policy</a>
            <a href='#' target="_blank" aria-label="View Terms of Use (open a new window)">Terms & Conditions</a>
            <a href='#' target="_blank" aria-label="View Cookie Settings (open a new window)">Cookie Settings</a>
          </nav>
        </div>
      </div>
    </div>
  `;

  // Clear existing content and add the footer structure
  block.innerHTML = footerHTML;
  block.classList.add('experiencefragment');

  // Add newsletter form functionality
  const form = block.querySelector('.newsletter');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = form.querySelector('input[type="email"]');
      if (emailInput && emailInput.value) {
        // Handle newsletter signup - you can add your logic here
        console.log('Newsletter signup:', emailInput.value);
        // Show success message or redirect
        alert('Thank you for signing up for our newsletter!');
        emailInput.value = '';
      }
    });
  }
}
