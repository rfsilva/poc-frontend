import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PersonService } from './person.service';
import { Person } from '../models/person.model';
import { PageResponse } from '../models/page-response.model';

describe('PersonService', () => {
  let service: PersonService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PersonService]
    });
    service = TestBed.inject(PersonService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all persons', () => {
    const mockPersons: Person[] = [
      { id: '1', name: 'John Doe', email: 'john@example.com', nationality: 'USA' },
      { id: '2', name: 'Jane Doe', email: 'jane@example.com', nationality: 'CAN' }
    ];

    service.getAll().subscribe(persons => {
      expect(persons).toEqual(mockPersons);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/persons');
    expect(req.request.method).toBe('GET');
    req.flush(mockPersons);
  });

  it('should get all persons with pagination', () => {
    const mockResponse: PageResponse<Person> = {
      content: [
        { id: '1', name: 'John Doe', email: 'john@example.com', nationality: 'USA' }
      ],
      pageNumber: 0,
      pageSize: 10,
      totalElements: 1,
      totalPages: 1,
      last: true
    };

    service.getAllPaged(0, 10, 'name', 'ASC').subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/persons/paged?page=0&size=10&sortBy=name&direction=ASC');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should search persons by name with pagination', () => {
    const mockResponse: PageResponse<Person> = {
      content: [
        { id: '1', name: 'John Doe', email: 'john@example.com', nationality: 'USA' }
      ],
      pageNumber: 0,
      pageSize: 10,
      totalElements: 1,
      totalPages: 1,
      last: true
    };

    service.searchByNamePaged('John', 0, 10, 'name', 'ASC').subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/persons/search/paged?name=John&page=0&size=10&sortBy=name&direction=ASC');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should filter persons with multiple criteria', () => {
    const mockResponse: PageResponse<Person> = {
      content: [
        { id: '1', name: 'John Doe', email: 'john@example.com', nationality: 'USA', gender: 'M' }
      ],
      pageNumber: 0,
      pageSize: 10,
      totalElements: 1,
      totalPages: 1,
      last: true
    };

    const filters = {
      name: 'John',
      email: 'john@example.com',
      gender: 'M'
    };

    service.filterPersons(filters, 0, 10, 'name', 'ASC').subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/persons/filter?page=0&size=10&sortBy=name&direction=ASC&name=John&email=john@example.com&gender=M');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should filter persons with POST method', () => {
    const mockResponse: PageResponse<Person> = {
      content: [
        { id: '1', name: 'John Doe', email: 'john@example.com', nationality: 'USA', cpf: '12345678901' }
      ],
      pageNumber: 0,
      pageSize: 10,
      totalElements: 1,
      totalPages: 1,
      last: true
    };

    const filters = {
      name: 'John',
      cpf: '12345678901'
    };

    service.filterPersonsPost(filters, 0, 10, 'name', 'ASC').subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/persons/filter?page=0&size=10&sortBy=name&direction=ASC');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ filters });
    req.flush(mockResponse);
  });

  it('should clear cache', () => {
    service.clearCache().subscribe(response => {
      expect(response).toBeUndefined();
    });

    const req = httpMock.expectOne('http://localhost:8080/api/persons/cache/clear');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});