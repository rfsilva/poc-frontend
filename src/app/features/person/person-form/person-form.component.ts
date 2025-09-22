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
  templateUrl: './person-form.component.html',
  styleUrls: ['./person-form.component.scss']
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
      cpf: ['', this.cpfValidator],
      nationality: ['BRA', Validators.required],
      passport: [''],
      gender: [''],
      address: [''],
      phoneNumber: ['']
    });
    
    // Inicializa o campo de passaporte como não obrigatório (brasileiro por padrão)
    this.onNationalityChange();
  }

  // Validador personalizado para CPF que aceita a máscara
  cpfValidator(control: any) {
    if (!control.value) {
      return null; // CPF não é obrigatório
    }
    
    // Remove a formatação para verificar se tem 11 dígitos
    const cpfDigits = control.value.replace(/\D/g, '');
    
    if (cpfDigits.length !== 11) {
      return { cpfInvalid: true };
    }
    
    return null;
  }

  loadPerson(id: string): void {
    this.loading = true;
    this.personService.getById(id).subscribe({
      next: (person) => {
        // Se o CPF existe, formata-o antes de exibir no formulário
        let formattedCpf = person.cpf;
        if (formattedCpf) {
          formattedCpf = this.applyCpfMask(formattedCpf);
        }
        
        this.personForm.patchValue({
          name: person.name,
          email: person.email,
          cpf: formattedCpf,
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
    const formData = {...this.personForm.value};
    
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
    
    // Aplica a máscara ao CPF
    event.target.value = this.applyCpfMask(value);
    
    // Limpa o erro de CPF quando o usuário começa a digitar novamente
    this.clearCpfError();
  }

  // Método para aplicar a máscara ao CPF
  applyCpfMask(value: string): string {
    if (!value) return '';
    
    value = value.replace(/\D/g, '');
    
    if (value.length > 9) {
      return value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    } else if (value.length > 6) {
      return value.replace(/^(\d{3})(\d{3})(\d{1,3})$/, '$1.$2.$3');
    } else if (value.length > 3) {
      return value.replace(/^(\d{3})(\d{1,3})$/, '$1.$2');
    } else {
      return value;
    }
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