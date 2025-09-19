import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PersonService } from '../../../core/services/person.service';
import { COUNTRIES, GENDERS, Person } from '../../../core/models/person.model';
import { HttpErrorResponse } from '@angular/common/http';

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
            <label for="cpf" class="form-label">CPF</label>
            <input 
              type="text" 
              class="form-control" 
              id="cpf" 
              formControlName="cpf"
              [ngClass]="{'is-invalid': (submitted && f['cpf'].errors) || cpfError}"
              (input)="formatCpf($event)"
              (focus)="clearCpfError()"
            >
            <div *ngIf="(submitted && f['cpf'].errors) || cpfError" class="invalid-feedback">
              <div *ngIf="f['cpf'].errors?.['pattern']">CPF deve conter apenas números</div>
              <div *ngIf="f['cpf'].errors?.['minlength'] || f['cpf'].errors?.['maxlength']">CPF deve ter 11 dígitos</div>
              <div *ngIf="cpfError">{{ cpfErrorMessage }}</div>
            </div>
          </div>
          
          <div class="mb-3">
            <label for="nationality" class="form-label">Nacionalidade *</label>
            <select 
              class="form-select" 
              id="nationality" 
              formControlName="nationality"
              [ngClass]="{'is-invalid': submitted && f['nationality'].errors}"
              (change)="onNationalityChange()"
            >
              <option value="" disabled>Selecione um país</option>
              <option *ngFor="let country of countries" [value]="country.code">
                {{ country.flag }} {{ country.name }} ({{ country.code }})
              </option>
            </select>
            <div *ngIf="submitted && f['nationality'].errors" class="invalid-feedback">
              <div *ngIf="f['nationality'].errors['required']">Nacionalidade é obrigatória</div>
            </div>
          </div>
          
          <div class="mb-3" *ngIf="showPassportField">
            <label for="passport" class="form-label">Passaporte *</label>
            <input 
              type="text" 
              class="form-control" 
              id="passport" 
              formControlName="passport"
              [ngClass]="{'is-invalid': submitted && f['passport'].errors}"
            >
            <div *ngIf="submitted && f['passport'].errors" class="invalid-feedback">
              <div *ngIf="f['passport'].errors['required']">Passaporte é obrigatório para estrangeiros</div>
            </div>
          </div>
          
          <div class="mb-3">
            <label for="gender" class="form-label">Gênero</label>
            <select 
              class="form-select" 
              id="gender" 
              formControlName="gender"
            >
              <option value="" disabled>Selecione um gênero</option>
              <option *ngFor="let gender of genders" [value]="gender.value">
                {{ gender.display }}
              </option>
            </select>
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
    
    <div class="toast-container position-fixed bottom-0 end-0 p-3" *ngIf="showToast">
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
    
    <!-- Alerta de erro de CPF que permanece visível -->
    <div *ngIf="cpfError" class="alert alert-danger alert-dismissible fade show position-fixed bottom-0 start-0 m-3" role="alert">
      <strong>Erro de CPF:</strong> {{ cpfErrorMessage }}
      <button type="button" class="btn-close" (click)="clearCpfError()"></button>
    </div>
  `
})
export class PersonFormComponent implements OnInit {
  personForm!: FormGroup;
  isEditMode = false;
  personId?: string;
  loading = false;
  submitting = false;
  submitted = false;
  showToast = false;
  toastMessage = '';
  toastError = false;
  countries = COUNTRIES;
  genders = GENDERS;
  showPassportField = false;
  cpfError = false;
  cpfErrorMessage = '';

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
      this.personId = id;
      this.loadPerson(this.personId);
    }
  }

  get f() { return this.personForm.controls; }

  initForm(): void {
    this.personForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      cpf: ['', [Validators.pattern(/^\d{11}$/)]],
      nationality: ['BRA', Validators.required],
      passport: [''],
      gender: [''],
      address: [''],
      phoneNumber: ['']
    });
    
    // Inicializa o campo de passaporte como não obrigatório (brasileiro por padrão)
    this.onNationalityChange();
  }

  loadPerson(id: string): void {
    this.loading = true;
    this.personService.getById(id).subscribe({
      next: (person) => {
        this.personForm.patchValue({
          name: person.name,
          email: person.email,
          cpf: person.cpf,
          nationality: person.nationality,
          passport: person.passport,
          gender: person.gender,
          address: person.address,
          phoneNumber: person.phoneNumber
        });
        
        // Atualiza a validação do passaporte com base na nacionalidade
        this.onNationalityChange();
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
    this.clearCpfError();
    
    if (this.personForm.invalid) {
      return;
    }
    
    this.submitting = true;
    const formData = this.personForm.value;
    
    // Remove formatação do CPF antes de enviar para o backend
    if (formData.cpf) {
      formData.cpf = formData.cpf.replace(/\D/g, '');
    }
    
    const personData: Person = formData;
    
    if (this.isEditMode && this.personId) {
      this.personService.update(this.personId, personData).subscribe({
        next: () => {
          this.submitting = false;
          this.showToastMessage('Pessoa atualizada com sucesso!');
          setTimeout(() => this.router.navigate(['/persons']), 1500);
        },
        error: (error) => {
          this.handleError(error);
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
          this.handleError(error);
        }
      });
    }
  }

  handleError(error: any): void {
    this.submitting = false;
    
    if (error instanceof HttpErrorResponse) {
      // Verifica se é o erro específico de CPF inválido
      if (error.status === 400 && error.error && error.error.message && 
          error.error.message.includes('Invalid CPF')) {
        this.cpfError = true;
        this.cpfErrorMessage = 'CPF inválido. Por favor, forneça um número de CPF válido.';
        // Foca no campo de CPF para chamar atenção do usuário
        setTimeout(() => {
          const cpfInput = document.getElementById('cpf');
          if (cpfInput) {
            cpfInput.focus();
          }
        }, 100);
      } else {
        // Outros erros
        this.showToastMessage(
          error.error?.message || 'Ocorreu um erro ao processar sua solicitação', 
          true
        );
      }
    } else {
      console.error('Error processing request', error);
      this.showToastMessage('Erro ao processar solicitação', true);
    }
  }

  formatCpf(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    
    if (value.length > 11) {
      value = value.substring(0, 11);
    }
    
    // Formata o CPF enquanto o usuário digita
    if (value.length > 9) {
      event.target.value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    } else if (value.length > 6) {
      event.target.value = value.replace(/^(\d{3})(\d{3})(\d{1,3})$/, '$1.$2.$3');
    } else if (value.length > 3) {
      event.target.value = value.replace(/^(\d{3})(\d{1,3})$/, '$1.$2');
    } else {
      event.target.value = value;
    }
    
    // Limpa o erro de CPF quando o usuário começa a digitar novamente
    this.clearCpfError();
  }

  clearCpfError(): void {
    this.cpfError = false;
    this.cpfErrorMessage = '';
  }

  onNationalityChange(): void {
    const nationality = this.personForm.get('nationality')?.value;
    this.showPassportField = nationality !== 'BRA';
    
    const passportControl = this.personForm.get('passport');
    if (this.showPassportField) {
      // Passaporte é obrigatório para estrangeiros
      passportControl?.setValidators([Validators.required]);
    } else {
      // Passaporte é opcional para brasileiros
      passportControl?.clearValidators();
    }
    passportControl?.updateValueAndValidity();
  }

  goBack(): void {
    this.router.navigate(['/persons']);
  }

  showToastMessage(message: string, isError = false): void {
    this.toastMessage = message;
    this.toastError = isError;
    this.showToast = true;
    // Aumenta o tempo de exibição do toast para 6 segundos (6000ms)
    setTimeout(() => this.showToast = false, 6000);
  }
}