import { Component, OnInit, AfterViewInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PersonService } from '../../../core/services/person.service';
import { Person } from '../../../core/models/person.model';
import { PageResponse } from '../../../core/models/page-response.model';
import { trigger, state, style, transition, animate } from '@angular/animations';

declare var bootstrap: any;

@Component({
  selector: 'app-person-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  animations: [
    trigger('filterAnimation', [
      state('collapsed', style({
        height: '0',
        opacity: 0,
        overflow: 'hidden',
        padding: '0',
        margin: '0'
      })),
      state('expanded', style({
        height: '*',
        opacity: 1
      })),
      transition('collapsed <=> expanded', [
        animate('300ms ease-in-out')
      ])
    ])
  ],
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

    <!-- Botão para mostrar/esconder o filtro -->
    <div class="row mb-3">
      <div class="col-12">
        <button class="btn btn-outline-primary w-100 d-flex justify-content-between align-items-center" (click)="toggleFilterVisibility()">
          <span>{{ showFilter ? 'Ocultar Filtros' : 'Mostrar Filtros' }}</span>
          <i class="bi" [ngClass]="showFilter ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
        </button>
      </div>
    </div>

    <!-- Filtro em estilo sanfonado -->
    <div class="filter-container" [@filterAnimation]="showFilter ? 'expanded' : 'collapsed'">
      <div class="card card-body mb-3">
        <div class="row">
          <div class="col-12">
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
      </div>
    </div>

    <!-- Indicador de filtro ativo -->
    <div class="row mb-3" *ngIf="searchTerm && !showFilter">
      <div class="col-12">
        <div class="alert alert-info mb-0 d-flex justify-content-between align-items-center">
          <span>Filtro ativo: "{{ searchTerm }}"</span>
          <button type="button" class="btn btn-sm btn-info" (click)="resetSearch()">Limpar</button>
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
              <th (click)="sort('name')">Nome <i *ngIf="sortBy === 'name'" [class]="sortDirection === 'ASC' ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i></th>
              <th (click)="sort('email')">Email <i *ngIf="sortBy === 'email'" [class]="sortDirection === 'ASC' ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i></th>
              <th>CPF</th>
              <th>Nacionalidade</th>
              <th>Gênero</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let person of persons">
              <td>{{ person.name }}</td>
              <td>{{ person.email }}</td>
              <td>{{ person.formattedCpf }}</td>
              <td><span [innerHTML]="person.nationalityFlag"></span> {{ person.nationalityName }}</td>
              <td>{{ person.genderDisplay }}</td>
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

      <!-- Paginação e seletor de itens por página -->
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-center mt-3" *ngIf="totalPages > 0">
        <div class="d-flex align-items-center mb-3 mb-md-0">
          <span class="me-3">Mostrando {{ persons.length }} de {{ totalElements }} registros</span>
          
          <!-- Combobox de itens por página movido para baixo -->
          <div class="dropdown">
            <button class="btn btn-outline-secondary dropdown-toggle" type="button" id="pageSizeDropdown" data-bs-toggle="dropdown" aria-expanded="false">
              {{ pageSize }} itens
            </button>
            <ul class="dropdown-menu" aria-labelledby="pageSizeDropdown">
              <li><a class="dropdown-item" href="javascript:void(0)" (click)="changePageSize(5)">5 itens</a></li>
              <li><a class="dropdown-item" href="javascript:void(0)" (click)="changePageSize(10)">10 itens</a></li>
              <li><a class="dropdown-item" href="javascript:void(0)" (click)="changePageSize(20)">20 itens</a></li>
              <li><a class="dropdown-item" href="javascript:void(0)" (click)="changePageSize(50)">50 itens</a></li>
            </ul>
          </div>
        </div>
        
        <nav>
          <ul class="pagination mb-0">
            <li class="page-item" [class.disabled]="currentPage === 0">
              <a class="page-link" href="javascript:void(0)" (click)="goToPage(0)">Primeira</a>
            </li>
            <li class="page-item" [class.disabled]="currentPage === 0">
              <a class="page-link" href="javascript:void(0)" (click)="goToPage(currentPage - 1)">Anterior</a>
            </li>
            
            <ng-container *ngFor="let page of getPageRange()">
              <li class="page-item" [class.active]="page === currentPage">
                <a class="page-link" href="javascript:void(0)" (click)="goToPage(page)">{{ page + 1 }}</a>
              </li>
            </ng-container>
            
            <li class="page-item" [class.disabled]="currentPage === totalPages - 1">
              <a class="page-link" href="javascript:void(0)" (click)="goToPage(currentPage + 1)">Próxima</a>
            </li>
            <li class="page-item" [class.disabled]="currentPage === totalPages - 1">
              <a class="page-link" href="javascript:void(0)" (click)="goToPage(totalPages - 1)">Última</a>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <div class="toast-container position-fixed bottom-0 end-0 p-3" *ngIf="showToast">
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
  `,
  styles: [`
    /* Estilos para a animação do filtro */
    .filter-container {
      overflow: hidden;
    }
    
    /* Estilo para o botão de filtro */
    .btn-outline-primary:focus {
      box-shadow: none;
    }
    
    /* Estilo para o spinner de carregamento */
    .loading-spinner {
      width: 3rem;
      height: 3rem;
      border: 5px solid #f3f3f3;
      border-top: 5px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    /* Adicione ícones Bootstrap se ainda não estiverem incluídos */
    @import url("https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css");
    
    /* Ajustes para responsividade */
    @media (max-width: 767px) {
      .pagination {
        justify-content: center;
      }
    }
  `]
})
export class PersonListComponent implements OnInit, AfterViewInit {
  persons: Person[] = [];
  loading = false;
  searchTerm = '';
  showToast = false;
  toastMessage = '';
  
  // Controle de visibilidade do filtro
  showFilter = false;
  
  // Paginação
  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;
  
  // Ordenação
  sortBy = 'name';
  sortDirection = 'ASC';

  constructor(private personService: PersonService, private elementRef: ElementRef) {}

  ngOnInit(): void {
    this.loadPersonsPaged();
  }

  ngAfterViewInit(): void {
    // Inicializar os dropdowns do Bootstrap após a renderização da view
    setTimeout(() => {
      const dropdownElementList = this.elementRef.nativeElement.querySelectorAll('.dropdown-toggle');
      dropdownElementList.forEach((dropdownToggleEl: any) => {
        new bootstrap.Dropdown(dropdownToggleEl);
      });
    }, 0);
  }

  toggleFilterVisibility(): void {
    this.showFilter = !this.showFilter;
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
        
        // Fechar o filtro após a pesquisa
        if (this.showFilter) {
          this.showFilter = false;
        }
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