import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PersonService } from '../../../core/services/person.service';
import { Person } from '../../../core/models/person.model';

@Component({
  selector: 'app-person-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="row mb-4">
      <div class="col-md-6">
        <h2>Lista de Pessoas</h2>
      </div>
      <div class="col-md-6 text-end">
        <button class="btn btn-primary me-2" routerLink="/persons/new">Nova Pessoa</button>
        <button class="btn btn-secondary" (click)="clearCache()">Limpar Cache</button>
      </div>
    </div>

    <div class="row mb-3">
      <div class="col-md-6">
        <div class="input-group">
          <input 
            type="text" 
            class="form-control" 
            placeholder="Buscar por nome..." 
            [(ngModel)]="searchTerm"
            (keyup.enter)="searchPersons()"
          >
          <button class="btn btn-outline-secondary" type="button" (click)="searchPersons()">Buscar</button>
          <button class="btn btn-outline-secondary" type="button" (click)="resetSearch()">Limpar</button>
        </div>
      </div>
    </div>

    <div *ngIf="loading" class="text-center my-5">
      <div class="loading-spinner"></div>
      <p class="mt-2">Carregando...</p>
    </div>

    <div *ngIf="!loading">
      <div *ngIf="persons.length === 0" class="alert alert-info">
        Nenhuma pessoa encontrada.
      </div>

      <div class="table-responsive" *ngIf="persons.length > 0">
        <table class="table table-striped table-hover">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Email</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let person of persons">
              <td>{{ person.id }}</td>
              <td>{{ person.name }}</td>
              <td>{{ person.email }}</td>
              <td>
                <div class="btn-group">
                  <button class="btn btn-sm btn-outline-primary" [routerLink]="['/persons', person.id]">Ver</button>
                  <button class="btn btn-sm btn-outline-secondary" [routerLink]="['/persons/edit', person.id]">Editar</button>
                  <button class="btn btn-sm btn-outline-danger" (click)="deletePerson(person.id!)">Excluir</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="toast-container" *ngIf="showToast">
      <div class="toast show bg-success text-white">
        <div class="toast-header bg-success text-white">
          <strong class="me-auto">Sucesso</strong>
          <button type="button" class="btn-close" (click)="showToast = false"></button>
        </div>
        <div class="toast-body">
          {{ toastMessage }}
        </div>
      </div>
    </div>
  `
})
export class PersonListComponent implements OnInit {
  persons: Person[] = [];
  loading = false;
  searchTerm = '';
  showToast = false;
  toastMessage = '';

  constructor(private personService: PersonService) {}

  ngOnInit(): void {
    this.loadPersons();
  }

  loadPersons(): void {
    this.loading = true;
    this.personService.getAll().subscribe({
      next: (data) => {
        this.persons = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching persons', error);
        this.loading = false;
      }
    });
  }

  searchPersons(): void {
    if (!this.searchTerm.trim()) {
      this.loadPersons();
      return;
    }

    this.loading = true;
    this.personService.searchByName(this.searchTerm).subscribe({
      next: (data) => {
        this.persons = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error searching persons', error);
        this.loading = false;
      }
    });
  }

  resetSearch(): void {
    this.searchTerm = '';
    this.loadPersons();
  }

  deletePerson(id: number): void {
    if (confirm('Tem certeza que deseja excluir esta pessoa?')) {
      this.loading = true;
      this.personService.delete(id).subscribe({
        next: () => {
          this.persons = this.persons.filter(person => person.id !== id);
          this.loading = false;
          this.showToast = true;
          this.toastMessage = 'Pessoa excluída com sucesso!';
          setTimeout(() => this.showToast = false, 3000);
        },
        error: (error) => {
          console.error('Error deleting person', error);
          this.loading = false;
        }
      });
    }
  }

  clearCache(): void {
    this.personService.clearCache().subscribe({
      next: () => {
        this.showToast = true;
        this.toastMessage = 'Cache limpo com sucesso!';
        setTimeout(() => this.showToast = false, 3000);
      },
      error: (error) => {
        console.error('Error clearing cache', error);
      }
    });
  }
}