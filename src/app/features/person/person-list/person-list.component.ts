import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PersonService } from '../../../core/services/person.service';
import { Person } from '../../../core/models/person.model';
import { PageResponse } from '../../../core/models/page-response.model';

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
      <div class="col-md-6 text-end">
        <div class="btn-group">
          <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
            {{ pageSize }} itens por página
          </button>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" (click)="changePageSize(5)">5 itens</a></li>
            <li><a class="dropdown-item" (click)="changePageSize(10)">10 itens</a></li>
            <li><a class="dropdown-item" (click)="changePageSize(20)">20 itens</a></li>
            <li><a class="dropdown-item" (click)="changePageSize(50)">50 itens</a></li>
          </ul>
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
              <th (click)="sort('id')">ID <i *ngIf="sortBy === 'id'" [class]="sortDirection === 'ASC' ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i></th>
              <th (click)="sort('name')">Nome <i *ngIf="sortBy === 'name'" [class]="sortDirection === 'ASC' ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i></th>
              <th (click)="sort('email')">Email <i *ngIf="sortBy === 'email'" [class]="sortDirection === 'ASC' ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i></th>
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

      <!-- Paginação -->
      <div class="d-flex justify-content-between align-items-center mt-3" *ngIf="totalPages > 0">
        <div>
          Mostrando {{ persons.length }} de {{ totalElements }} registros
        </div>
        <nav>
          <ul class="pagination">
            <li class="page-item" [class.disabled]="currentPage === 0">
              <a class="page-link" (click)="goToPage(0)">Primeira</a>
            </li>
            <li class="page-item" [class.disabled]="currentPage === 0">
              <a class="page-link" (click)="goToPage(currentPage - 1)">Anterior</a>
            </li>
            
            <ng-container *ngFor="let page of getPageRange()">
              <li class="page-item" [class.active]="page === currentPage">
                <a class="page-link" (click)="goToPage(page)">{{ page + 1 }}</a>
              </li>
            </ng-container>
            
            <li class="page-item" [class.disabled]="currentPage === totalPages - 1">
              <a class="page-link" (click)="goToPage(currentPage + 1)">Próxima</a>
            </li>
            <li class="page-item" [class.disabled]="currentPage === totalPages - 1">
              <a class="page-link" (click)="goToPage(totalPages - 1)">Última</a>
            </li>
          </ul>
        </nav>
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
  
  // Paginação
  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;
  
  // Ordenação
  sortBy = 'name';
  sortDirection = 'ASC';

  constructor(private personService: PersonService) {}

  ngOnInit(): void {
    this.loadPersonsPaged();
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
  
  loadPersonsPaged(): void {
    this.loading = true;
    this.personService.getAllPaged(this.currentPage, this.pageSize, this.sortBy, this.sortDirection).subscribe({
      next: (response) => {
        this.persons = response.content;
        this.currentPage = response.pageNumber;
        this.totalPages = response.totalPages;
        this.totalElements = response.totalElements;
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
      this.loadPersonsPaged();
      return;
    }

    this.loading = true;
    this.currentPage = 0; // Reset to first page on new search
    
    this.personService.searchByNamePaged(
      this.searchTerm, 
      this.currentPage, 
      this.pageSize, 
      this.sortBy, 
      this.sortDirection
    ).subscribe({
      next: (response) => {
        this.persons = response.content;
        this.currentPage = response.pageNumber;
        this.totalPages = response.totalPages;
        this.totalElements = response.totalElements;
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
    this.currentPage = 0;
    this.loadPersonsPaged();
  }

  deletePerson(id: string): void {
    if (confirm('Tem certeza que deseja excluir esta pessoa?')) {
      this.loading = true;
      this.personService.delete(id).subscribe({
        next: () => {
          // Recarregar a página atual após exclusão
          this.loadPersonsPaged();
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
        // Recarregar dados após limpar o cache
        this.loadPersonsPaged();
      },
      error: (error) => {
        console.error('Error clearing cache', error);
      }
    });
  }
  
  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) {
      return;
    }
    this.currentPage = page;
    
    if (this.searchTerm.trim()) {
      this.searchPersons();
    } else {
      this.loadPersonsPaged();
    }
  }
  
  changePageSize(size: number): void {
    this.pageSize = size;
    this.currentPage = 0; // Reset to first page when changing page size
    
    if (this.searchTerm.trim()) {
      this.searchPersons();
    } else {
      this.loadPersonsPaged();
    }
  }
  
  sort(column: string): void {
    if (this.sortBy === column) {
      // Toggle direction if clicking on the same column
      this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortBy = column;
      this.sortDirection = 'ASC';
    }
    
    if (this.searchTerm.trim()) {
      this.searchPersons();
    } else {
      this.loadPersonsPaged();
    }
  }
  
  getPageRange(): number[] {
    const maxPagesToShow = 5;
    let startPage = Math.max(0, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages - 1, startPage + maxPagesToShow - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(0, endPage - maxPagesToShow + 1);
    }
    
    const pages: number[] = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }
}