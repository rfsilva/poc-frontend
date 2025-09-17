import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PersonService } from '../../../core/services/person.service';
import { Person } from '../../../core/models/person.model';

@Component({
  selector: 'app-person-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h3>Detalhes da Pessoa</h3>
        <div>
          <button class="btn btn-outline-primary me-2" [routerLink]="['/persons/edit', person?.id]">Editar</button>
          <button class="btn btn-outline-secondary" routerLink="/persons">Voltar</button>
        </div>
      </div>
      
      <div *ngIf="loading" class="card-body text-center">
        <div class="loading-spinner"></div>
        <p class="mt-2">Carregando...</p>
      </div>
      
      <div *ngIf="!loading && person" class="card-body">
        <div class="row mb-3">
          <div class="col-md-3 fw-bold">ID:</div>
          <div class="col-md-9">{{ person.id }}</div>
        </div>
        
        <div class="row mb-3">
          <div class="col-md-3 fw-bold">Nome:</div>
          <div class="col-md-9">{{ person.name }}</div>
        </div>
        
        <div class="row mb-3">
          <div class="col-md-3 fw-bold">Email:</div>
          <div class="col-md-9">{{ person.email }}</div>
        </div>
        
        <div class="row mb-3" *ngIf="person.address">
          <div class="col-md-3 fw-bold">Endereço:</div>
          <div class="col-md-9">{{ person.address }}</div>
        </div>
        
        <div class="row mb-3" *ngIf="person.phoneNumber">
          <div class="col-md-3 fw-bold">Telefone:</div>
          <div class="col-md-9">{{ person.phoneNumber }}</div>
        </div>
      </div>
      
      <div *ngIf="!loading && !person" class="card-body">
        <div class="alert alert-danger">
          Pessoa não encontrada.
        </div>
      </div>
    </div>
  `
})
export class PersonDetailComponent implements OnInit {
  person: Person | null = null;
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private personService: PersonService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    const id = Number(this.route.snapshot.paramMap.get('id'));
    
    if (isNaN(id)) {
      this.router.navigate(['/persons']);
      return;
    }
    
    this.personService.getById(id).subscribe({
      next: (data) => {
        this.person = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching person details', error);
        this.loading = false;
      }
    });
  }
}