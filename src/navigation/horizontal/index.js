export default [
  {
    title: 'Home',
    to: { name: 'root' },
    icon: { icon: 'tabler-smart-home' },
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
    title: 'Masters',
    icon: { icon: 'tabler-settings' },
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
