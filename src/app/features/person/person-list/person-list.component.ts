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
  templateUrl: './person-list.component.html',
  styleUrls: ['./person-list.component.scss'],
  animations: [
    trigger('filterAnimation', [
      state('collapsed', style({
        height: '0',
        opacity: 0,
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
  ]
})
export class PersonListComponent implements OnInit, AfterViewInit {
  persons: Person[] = [];
  loading = false;
  showToast = false;
  toastMessage = '';
  
  // Controle de visibilidade do filtro
  showFilter = false;
  
  // Filtros
  filters = {
    name: '',
    email: '',
    cpf: '',
    passport: '',
    gender: ''
  };
  
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

  // Método para aplicar filtros pela primeira vez (redefine para página 0)
  applyFilters(): void {
    this.currentPage = 0; // Reset to first page on new search
    this.loadFilteredPersons();
    
    // Fechar o filtro após a pesquisa
    if (this.showFilter) {
      this.showFilter = false;
    }
  }

  // Método para carregar pessoas filtradas sem redefinir a página atual
  loadFilteredPersons(): void {
    this.loading = true;
    
    // Remover filtros vazios e remover formatação do CPF
    const activeFilters = this.getActiveFilters();
    
    this.personService.filterPersons(
      activeFilters,
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
        console.error('Error filtering persons', error);
        this.loading = false;
      }
    });
  }

  resetFilters(): void {
    this.filters = {
      name: '',
      email: '',
      cpf: '',
      passport: '',
      gender: ''
    };
    this.currentPage = 0;
    this.loadPersonsPaged();
  }

  hasActiveFilters(): boolean {
    return Object.values(this.filters).some(value => value !== '');
  }

  getActiveFilters(): any {
    const activeFilters: any = {};
    
    Object.entries(this.filters).forEach(([key, value]) => {
      if (value !== '') {
        // Se for CPF, remover a formatação antes de enviar para o backend
        if (key === 'cpf') {
          activeFilters[key] = value.replace(/\D/g, ''); // Remove todos os caracteres não numéricos
        } else {
          activeFilters[key] = value;
        }
      }
    });
    
    return activeFilters;
  }

  // Método para formatar CPF no campo de entrada
  formatCpf(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    
    if (value.length > 11) {
      value = value.substring(0, 11);
    }
    
    // Aplica a máscara ao CPF
    if (value.length > 9) {
      event.target.value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    } else if (value.length > 6) {
      event.target.value = value.replace(/^(\d{3})(\d{3})(\d{1,3})$/, '$1.$2.$3');
    } else if (value.length > 3) {
      event.target.value = value.replace(/^(\d{3})(\d{1,3})$/, '$1.$2');
    } else {
      event.target.value = value;
    }
  }

  deletePerson(id: string): void {
    if (confirm('Tem certeza que deseja excluir esta pessoa?')) {
      this.loading = true;
      this.personService.delete(id).subscribe({
        next: () => {
          // Recarregar a página atual após exclusão
          if (this.hasActiveFilters()) {
            this.loadFilteredPersons();
          } else {
            this.loadPersonsPaged();
          }
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
        if (this.hasActiveFilters()) {
          this.loadFilteredPersons();
        } else {
          this.loadPersonsPaged();
        }
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
    
    if (this.hasActiveFilters()) {
      this.loadFilteredPersons(); // Usa o método que não redefine a página
    } else {
      this.loadPersonsPaged();
    }
  }
  
  changePageSize(size: number): void {
    this.pageSize = size;
    this.currentPage = 0; // Reset to first page when changing page size
    
    if (this.hasActiveFilters()) {
      this.loadFilteredPersons();
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
    
    if (this.hasActiveFilters()) {
      this.loadFilteredPersons();
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