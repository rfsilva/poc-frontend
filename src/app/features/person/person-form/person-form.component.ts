import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PersonService } from '../../../core/services/person.service';
import { Person } from '../../../core/models/person.model';

@Component({
  selector: 'app-person-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="card">
      <div class="card-header">
        <h3>{{ isEditMode ? 'Editar' : 'Nova' }} Pessoa</h3>
      </div>
      
      <div *ngIf="loading" class="card-body text-center">
        <div class="loading-spinner"></div>
        <p class="mt-2">Carregando...</p>
      </div>
      
      <div *ngIf="!loading" class="card-body">
        <form [formGroup]="personForm" (ngSubmit)="onSubmit()">
          <div class="mb-3">
            <label for="name" class="form-label">Nome *</label>
            <input 
              type="text" 
              class="form-control" 
              id="name" 
              formControlName="name"
              [ngClass]="{'is-invalid': submitted && f['name'].errors}"
            >
            <div *ngIf="submitted && f['name'].errors" class="invalid-feedback">
              <div *ngIf="f['name'].errors['required']">Nome é obrigatório</div>
            </div>
          </div>
          
          <div class="mb-3">
            <label for="email" class="form-label">Email *</label>
            <input 
              type="email" 
              class="form-control" 
              id="email" 
              formControlName="email"
              [ngClass]="{'is-invalid': submitted && f['email'].errors}"
            >
            <div *ngIf="submitted && f['email'].errors" class="invalid-feedback">
              <div *ngIf="f['email'].errors['required']">Email é obrigatório</div>
              <div *ngIf="f['email'].errors['email']">Email inválido</div>
            </div>
          </div>
          
          <div class="mb-3">
            <label for="address" class="form-label">Endereço</label>
            <input 
              type="text" 
              class="form-control" 
              id="address" 
              formControlName="address"
            >
          </div>
          
          <div class="mb-3">
            <label for="phoneNumber" class="form-label">Telefone</label>
            <input 
              type="text" 
              class="form-control" 
              id="phoneNumber" 
              formControlName="phoneNumber"
            >
          </div>
          
          <div class="d-flex justify-content-between">
            <button type="button" class="btn btn-secondary" (click)="goBack()">Cancelar</button>
            <button type="submit" class="btn btn-primary" [disabled]="submitting">
              <span *ngIf="submitting" class="spinner-border spinner-border-sm me-1"></span>
              {{ isEditMode ? 'Atualizar' : 'Salvar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <div class="toast-container" *ngIf="showToast">
      <div class="toast show" [ngClass]="{'bg-success': !toastError, 'bg-danger': toastError}" class="text-white">
        <div class="toast-header" [ngClass]="{'bg-success': !toastError, 'bg-danger': toastError}" class="text-white">
          <strong class="me-auto">{{ toastError ? 'Erro' : 'Sucesso' }}</strong>
          <button type="button" class="btn-close" (click)="showToast = false"></button>
        </div>
        <div class="toast-body">
          {{ toastMessage }}
        </div>
      </div>
    </div>
  `
})
export class PersonFormComponent implements OnInit {
  personForm!: FormGroup;
  isEditMode = false;
  personId?: number;
  loading = false;
  submitting = false;
  submitted = false;
  showToast = false;
  toastMessage = '';
  toastError = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private personService: PersonService
  ) {}

  ngOnInit(): void {
    this.initForm();
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.personId = +id;
      this.loadPerson(this.personId);
    }
  }

  get f() { return this.personForm.controls; }

  initForm(): void {
    this.personForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      address: [''],
      phoneNumber: ['']
    });
  }

  loadPerson(id: number): void {
    this.loading = true;
    this.personService.getById(id).subscribe({
      next: (person) => {
        
        this.personForm.patchValue({
          name: person.name,
          email: person.email,
          address: person.address,
          phoneNumber: person.phoneNumber
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading person', error);
        this.loading = false;
        this.showToastMessage('Erro ao carregar dados da pessoa', true);
      }
    });
  }

  onSubmit(): void {
    this.submitted = true;
    
    if (this.personForm.invalid) {
      return;
    }
    
    this.submitting = true;
    const personData: Person = this.personForm.value;
    
    if (this.isEditMode && this.personId) {
      this.personService.update(this.personId, personData).subscribe({
        next: () => {
          this.submitting = false;
          this.showToastMessage('Pessoa atualizada com sucesso!');
          setTimeout(() => this.router.navigate(['/persons']), 1500);
        },
        error: (error) => {
          console.error('Error updating person', error);
          this.submitting = false;
          this.showToastMessage('Erro ao atualizar pessoa', true);
        }
      });
    } else {
      this.personService.create(personData).subscribe({
        next: () => {
          this.submitting = false;
          this.showToastMessage('Pessoa criada com sucesso!');
          setTimeout(() => this.router.navigate(['/persons']), 1500);
        },
        error: (error) => {
          console.error('Error creating person', error);
          this.submitting = false;
          this.showToastMessage('Erro ao criar pessoa', true);
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/persons']);
  }

  showToastMessage(message: string, isError = false): void {
    this.toastMessage = message;
    this.toastError = isError;
    this.showToast = true;
    setTimeout(() => this.showToast = false, 3000);
  }
}