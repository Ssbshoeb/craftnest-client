export default [
  {
    title: 'Home',
    to: { name: 'root' },
    icon: { icon: 'tabler-smart-home' },

    // No permission required - everyone can see home
  },
  {
    title: 'Companies',
    to: { name: 'company' },
    icon: { icon: 'tabler-building' },
    requiredRole: 'SUPER ADMIN',
  },
  {
    title: 'Users',
    to: { name: 'users' },
    icon: { icon: 'tabler-users' },
    permission: 'USERS.VIEW',
  },
  {
    title: 'Notifications',
    to: { name: 'notifications' },
    icon: { icon: 'tabler-bell' },
    permission: 'NOTIFICATIONS.VIEW',
  },
  {
    title: 'Settings',
    to: { name: 'settings' },
    icon: { icon: 'tabler-settings' },
    permission: 'SETTINGS.VIEW',
  },
  {
    title: 'Orders',
    to: { name: 'orders' },
    icon: { icon: 'tabler-shopping-cart' },
    permission: 'ORDERS.VIEW',
  },
  {
    title: 'Customers',
    to: { name: 'customers' },
    icon: { icon: 'tabler-users-group' },
    permission: 'CUSTOMERS.VIEW',
  },
  {
    title: 'Reports',
    to: { name: 'reports' },
    icon: { icon: 'tabler-chart-bar' },
    permission: 'REPORTS.VIEW',
  },
  {
    title: 'Banners & Offers',
    to: { name: 'banners' },
    icon: { icon: 'tabler-photo' },
    permission: 'BANNERS.VIEW',
  },
  {
    title: 'Gallery',
    to: { name: 'gallery' },
    icon: { icon: 'tabler-photo-video' },
    permission: 'GALLERY.VIEW',
  },
  {
    title: 'Custom Enquiries',
    to: { name: 'custom-enquiries' },
    icon: { icon: 'tabler-message-dots' },
    permission: 'CUSTOM_ENQUIRIES.VIEW',
  },
  {
    title: 'Contact Messages',
    to: { name: 'contact-messages' },
    icon: { icon: 'tabler-mail' },
    permission: 'CONTACT_MESSAGES.VIEW',
  },
  {
    title: 'Reviews',
    to: { name: 'reviews' },
    icon: { icon: 'tabler-star' },
    permission: 'REVIEWS.VIEW',
  },
  {
    title: 'Catalogue',
    icon: { icon: 'tabler-armchair' },
    children: [
      {
        title: 'Categories',
        to: { name: 'categories' },
        icon: { icon: 'tabler-category' },
        permission: 'CATEGORIES.VIEW',
      },
      {
        title: 'Products',
        to: { name: 'products' },
        icon: { icon: 'tabler-sofa' },
        permission: 'PRODUCTS.VIEW',
      },
    ],
  },
  {
    title: 'Masters',
    icon: { icon: 'tabler-settings' },

    // Parent shown if user has permission to any child
    children: [
      {
        title: 'Positions',
        to: { name: 'positions' },
        icon: { icon: 'tabler-briefcase' },
        permission: 'POSITIONS.VIEW',
      },
      {
        title: 'Modules',
        to: { name: 'modules' },
        icon: { icon: 'tabler-components' },
        permission: 'MODULES.VIEW',
      },
      {
        title: 'Permissions',
        to: { name: 'permissions' },
        icon: { icon: 'tabler-lock' },
        permission: 'PERMISSIONS.VIEW',
      },
      {
        title: 'Values',
        to: { name: 'values' },
        icon: { icon: 'tabler-list-details' },
        permission: 'VALUES.VIEW',
      },
    ],
  },
]
