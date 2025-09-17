import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'persons', pathMatch: 'full' },
  { path: 'persons', loadComponent: () => import('./features/person/person-list/person-list.component').then(m => m.PersonListComponent) },
  { path: 'persons/new', loadComponent: () => import('./features/person/person-form/person-form.component').then(m => m.PersonFormComponent) },
  { path: 'persons/edit/:id', loadComponent: () => import('./features/person/person-form/person-form.component').then(m => m.PersonFormComponent) },
  { path: 'persons/:id', loadComponent: () => import('./features/person/person-detail/person-detail.component').then(m => m.PersonDetailComponent) },
  { path: '**', redirectTo: 'persons' }
];