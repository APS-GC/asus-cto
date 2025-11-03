

export default function decorate(block) {
    block.innerHTML = `<section class="section-with-bottom-spacing">
    <div class="cmp-container container">
      <div class="game-recommendation">
  <div class="carousel panelcontainer">
    <div class="section-heading">
  <div class="section-heading__text-group">
    <h2 class="section-heading__title">Select The Game You Play</h2>
    <p class="section-heading__description">We will recommend a plan that suits you most!</p>
  </div>
    <div class="section-heading__action-buttons cmp-carousel__actions">
      <button class="cmp-carousel__action cmp-carousel__action--previous cmp-carousel__action--disabled swiper-button-lock" disabled="" tabindex="-1" aria-label="Previous slide" aria-controls="swiper-wrapper-7e74c24c10f2d0494" aria-disabled="true">
      </button>
      <button class="cmp-carousel__action cmp-carousel__action--next cmp-carousel__action--disabled swiper-button-lock" disabled="" tabindex="-1" aria-label="Next slide" aria-controls="swiper-wrapper-7e74c24c10f2d0494" aria-disabled="true">
      </button>
    </div>
</div>

    <form id="game-selection-form" class="game-form" action="./product-matches.html" aria-label="Game selection form" data-select-game-form="" data-initialized="true">
      <div id="carousel-4e80c7e13l" class="cmp-carousel" role="group" aria-live="off" aria-roledescription="carousel" data-slides-per-view="auto" data-slides-per-view-tablet="6" data-slides-per-view-desktop="6" data-loop-slides="false">
        <div class="cmp-carousel__content cmp-carousel__content--overflow" aria-atomic="false" aria-live="polite"><div class="swiper swiper-initialized swiper-horizontal swiper-watch-progress swiper-backface-hidden"><div class="swiper-wrapper" id="swiper-wrapper-7e74c24c10f2d0494" aria-live="off"><div class="cmp-carousel__item swiper-slide swiper-slide-visible swiper-slide-fully-visible swiper-slide-active" role="group" aria-label="Slide 1 of 6" tabindex="-1" style="width: 145.333px; margin-right: 8px;">
              <div class="game-item">
  <input type="checkbox" id="game-you-play-cod" name="games" value="cod" data-name="Call of Duty: Modern Warfare" data-image="./clientlib-site/images/games/call-of-duty.webp" aria-label="Select Call of Duty: Modern Warfare">
  <div class="game-details-wrapper">
    <div class="image-outer">
      <div class="image-wrapper" aria-hidden="true">
        <img src="./clientlib-site/images/games/call-of-duty.webp" alt="Call of Duty: Modern Warfare" class="game-image" loading="lazy">
      </div>
      <div class="checkmark-overlay" aria-hidden="true"></div>
    </div>
    <label class="game-info" for="game-you-play-cod" aria-hidden="true">Call of Duty: Modern Warfare</label>
  </div>
</div>
            </div><div class="cmp-carousel__item swiper-slide swiper-slide-visible swiper-slide-fully-visible swiper-slide-next" role="group" aria-label="Slide 2 of 6" tabindex="-1" style="width: 145.333px; margin-right: 8px;">
              <div class="game-item">
  <input type="checkbox" id="game-you-play-alanwake" name="games" value="alanwake" data-name="Alan Wake 2" data-image="./clientlib-site/images/games/alan-wake.webp" aria-label="Select Alan Wake 2">
  <div class="game-details-wrapper">
    <div class="image-outer">
      <div class="image-wrapper" aria-hidden="true">
        <img src="./clientlib-site/images/games/alan-wake.webp" alt="Alan Wake 2" class="game-image" loading="lazy">
      </div>
      <div class="checkmark-overlay" aria-hidden="true"></div>
    </div>
    <label class="game-info" for="game-you-play-alanwake" aria-hidden="true">Alan Wake 2</label>
  </div>
</div>
            </div><div class="cmp-carousel__item swiper-slide swiper-slide-visible swiper-slide-fully-visible" role="group" aria-label="Slide 3 of 6" tabindex="-1" style="width: 145.333px; margin-right: 8px;">
              <div class="game-item">
  <input type="checkbox" id="game-you-play-cs2" name="games" value="cs2" data-name="Counter Strike 2" data-image="./clientlib-site/images/games/counter-strike.webp" aria-label="Select Counter Strike 2">
  <div class="game-details-wrapper">
    <div class="image-outer">
      <div class="image-wrapper" aria-hidden="true">
        <img src="./clientlib-site/images/games/counter-strike.webp" alt="Counter Strike 2" class="game-image" loading="lazy">
      </div>
      <div class="checkmark-overlay" aria-hidden="true"></div>
    </div>
    <label class="game-info" for="game-you-play-cs2" aria-hidden="true">Counter Strike 2</label>
  </div>
</div>
            </div><div class="cmp-carousel__item swiper-slide swiper-slide-visible swiper-slide-fully-visible" role="group" aria-label="Slide 4 of 6" tabindex="-1" style="width: 145.333px; margin-right: 8px;">
              <div class="game-item">
  <input type="checkbox" id="game-you-play-baldur" name="games" value="baldur" data-name="Baldur's Gate 3" data-image="./clientlib-site/images/games/baldurs-gate.webp" aria-label="Select Baldur's Gate 3">
  <div class="game-details-wrapper">
    <div class="image-outer">
      <div class="image-wrapper" aria-hidden="true">
        <img src="./clientlib-site/images/games/baldurs-gate.webp" alt="Baldur's Gate 3" class="game-image" loading="lazy">
      </div>
      <div class="checkmark-overlay" aria-hidden="true"></div>
    </div>
    <label class="game-info" for="game-you-play-baldur" aria-hidden="true">Baldur's Gate 3</label>
  </div>
</div>
            </div><div class="cmp-carousel__item swiper-slide swiper-slide-visible swiper-slide-fully-visible" role="group" aria-label="Slide 5 of 6" tabindex="-1" style="width: 145.333px; margin-right: 8px;">
              <div class="game-item">
  <input type="checkbox" id="game-you-play-civ6" name="games" value="civ6" data-name="Fortnite" data-image="./clientlib-site/images/games/fortnite.webp" aria-label="Select Fortnite">
  <div class="game-details-wrapper">
    <div class="image-outer">
      <div class="image-wrapper" aria-hidden="true">
        <img src="./clientlib-site/images/games/fortnite.webp" alt="Fortnite" class="game-image" loading="lazy">
      </div>
      <div class="checkmark-overlay" aria-hidden="true"></div>
    </div>
    <label class="game-info" for="game-you-play-civ6" aria-hidden="true">Fortnite</label>
  </div>
</div>
            </div><div class="cmp-carousel__item swiper-slide swiper-slide-visible" role="group" aria-label="Slide 6 of 6" tabindex="-1" style="width: 145.333px; margin-right: 8px;">
              <div class="game-item">
  <input type="checkbox" id="game-you-play-fortnite" name="games" value="fortnite" data-name="Red Redemption 2" data-image="./clientlib-site/images/games/red-redemption.webp" aria-label="Select Red Redemption 2">
  <div class="game-details-wrapper">
    <div class="image-outer">
      <div class="image-wrapper" aria-hidden="true">
        <img src="./clientlib-site/images/games/red-redemption.webp" alt="Red Redemption 2" class="game-image" loading="lazy">
      </div>
      <div class="checkmark-overlay" aria-hidden="true"></div>
    </div>
    <label class="game-info" for="game-you-play-fortnite" aria-hidden="true">Red Redemption 2</label>
  </div>
</div>
            </div></div><span class="swiper-notification" aria-live="assertive" aria-atomic="true"></span></div></div> 
      </div>

      <div class="budget-bar" role="group" aria-label="Your budget">
        <div class="budget-left">
            <div id="budget-range-label">Your budget:</div>
        </div>
        
        <div class="budget-center">
            <label for="budget-min-value" class="sr-only-fixed">Minimum Budget Value</label>
            <input class="budget-value" id="budget-min-value" value="$1,100">
            
            <div class="budget-separator" aria-hidden="true">to</div>
            
            <div id="maximum-budget-wrapper-mobile">
              <label for="budget-max-value" class="sr-only-fixed">Maximum Budget Value</label>
              <input class="budget-value" id="budget-max-value" value="$5,000">
            </div>
            
            <div class="budget-range-wrapper">
                <div id="budget-range" class="budget-range-slider noUi-target noUi-ltr noUi-horizontal noUi-txt-dir-ltr" data-start="[1100, 5000]" data-min="500" data-max="5000" data-step="100">
                <div class="noUi-base"><div class="noUi-connects"><div class="noUi-connect" style="transform: translate(13.3333%, 0px) scale(0.866667, 1);"></div></div><div class="noUi-origin" style="transform: translate(-86.6667%, 0px); z-index: 5;"><div class="noUi-handle noUi-handle-lower" data-handle="0" tabindex="0" aria-label="Budget range minimum value" aria-controls="min-budget" role="slider" aria-orientation="horizontal" aria-valuemin="500.0" aria-valuemax="4900.0" aria-valuenow="1100.0" aria-valuetext="$1100"><div class="noUi-touch-area"></div></div></div><div class="noUi-origin" style="transform: translate(0%, 0px); z-index: 4;"><div class="noUi-handle noUi-handle-upper" data-handle="1" tabindex="0" aria-label="Budget range maximum value" aria-controls="max-budget" role="slider" aria-orientation="horizontal" aria-valuemin="1200.0" aria-valuemax="5000.0" aria-valuenow="5000.0" aria-valuetext="$5000, maximum value reached"><div class="noUi-touch-area"></div></div></div></div></div>
                <div class="range-labels" aria-hidden="true">
                    <span>$500</span>
                    <span>$5,000</span>
                </div>
            </div>
            
            <div id="maximum-budget-wrapper-desktop"></div><!--desktop-wrapper-placeholder-->
        </div>
    
        <input type="hidden" name="min-budget" id="min-budget" value="1100">
        <input type="hidden" name="max-budget" id="max-budget" value="5000">
        
        <div class="budget-actions">
            <button type="reset" class="reset-button btn btn-link">Reset</button>
            <button type="submit" class="btn" disabled="">Help me choose</button> 
        </div>
      </div>
    </form>
  </div>
</div>
    </div>
  </section>`;
}
