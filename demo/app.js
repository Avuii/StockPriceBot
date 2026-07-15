const screens = {
  dashboard: {
    title: 'Dashboard',
    image: '../docs/dashboard.png',
    description: 'Summary cards, opportunities, savings chart, alerts, and categories.'
  },
  products: {
    title: 'Products',
    image: '../docs/productswithpanel.png',
    description: 'Tracked products with variants, filters, bulk actions, health status, and category panel.'
  },
  watchlist: {
    title: 'Watchlist',
    image: '../docs/watchlist.png',
    description: 'Bookmarked products kept in a dedicated quick-access view.'
  },
  categories: {
    title: 'Categories',
    image: '../docs/Categories.png',
    description: 'Custom category colors, Lucide icons, counters, and uncategorized products.'
  },
  alerts: {
    title: 'Alerts',
    image: '../docs/alerts.png',
    description: 'Unread alerts, alert history, daily digest preview, and email notification settings.'
  },
  statistics: {
    title: 'Statistics',
    image: '../docs/Statistics.png',
    description: 'Savings, average discounts, tracked value, top stores, and best deals.'
  },
  settings: {
    title: 'Settings',
    image: '../docs/settings.png',
    description: 'Onboarding, privacy notes, API token, alert email, and refresh interval.'
  },
  dark: {
    title: 'Dark Mode',
    image: '../docs/dark2.png',
    description: 'Dark purple interface with brighter shopping-oriented accents.'
  }
};

const image = document.querySelector('#screen-image');
const title = document.querySelector('#screen-title');
const description = document.querySelector('#screen-description');
const buttons = document.querySelectorAll('[data-screen]');

buttons.forEach((button) => {
  button.addEventListener('click', () => {
    const key = button.dataset.screen;
    const screen = screens[key];

    if (!screen) {
      return;
    }

    buttons.forEach((item) => item.classList.toggle('is-active', item === button));
    image.src = screen.image;
    image.alt = `${screen.title} screenshot`;
    title.textContent = screen.title;
    description.textContent = screen.description;
  });
});
