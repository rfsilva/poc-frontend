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

  describe('getAll', () => {
    it('should return all persons', () => {
      const mockPersons: Person[] = [
        { id: '1', name: 'John Doe', email: 'john@example.com', birthDate: '1990-01-01' },
        { id: '2', name: 'Jane Doe', email: 'jane@example.com', birthDate: '1992-02-02' }
      ];

      service.getAll().subscribe(persons => {
        expect(persons.length).toBe(2);
        expect(persons).toEqual(mockPersons);
      });

      const req = httpMock.expectOne('http://localhost:8080/api/persons');
      expect(req.request.method).toBe('GET');
      req.flush(mockPersons);
    });
  });

  describe('getAllPaged', () => {
    it('should return paged persons with default parameters', () => {
      const mockPersons: Person[] = [
        { id: '1', name: 'John Doe', email: 'john@example.com', birthDate: '1990-01-01' },
        { id: '2', name: 'Jane Doe', email: 'jane@example.com', birthDate: '1992-02-02' }
      ];
      
      const mockPageResponse: PageResponse<Person> = {
        content: mockPersons,
        pageNumber: 0,
        pageSize: 10,
        totalElements: 2,
        totalPages: 1,
        last: true
      };

      service.getAllPaged().subscribe(response => {
        expect(response.content.length).toBe(2);
        expect(response.content).toEqual(mockPersons);
        expect(response.pageNumber).toBe(0);
        expect(response.pageSize).toBe(10);
        expect(response.totalElements).toBe(2);
        expect(response.totalPages).toBe(1);
        expect(response.last).toBe(true);
      });

      const req = httpMock.expectOne('http://localhost:8080/api/persons/paged?page=0&size=10&sortBy=name&direction=ASC');
      expect(req.request.method).toBe('GET');
      req.flush(mockPageResponse);
    });

    it('should return paged persons with custom parameters', () => {
      const mockPersons: Person[] = [
        { id: '1', name: 'John Doe', email: 'john@example.com', birthDate: '1990-01-01' }
      ];
      
      const mockPageResponse: PageResponse<Person> = {
        content: mockPersons,
        pageNumber: 1,
        pageSize: 5,
        totalElements: 6,
        totalPages: 2,
        last: true
      };

      service.getAllPaged(1, 5, 'email', 'DESC').subscribe(response => {
        expect(response.content.length).toBe(1);
        expect(response.content).toEqual(mockPersons);
        expect(response.pageNumber).toBe(1);
        expect(response.pageSize).toBe(5);
        expect(response.totalElements).toBe(6);
        expect(response.totalPages).toBe(2);
        expect(response.last).toBe(true);
      });

      const req = httpMock.expectOne('http://localhost:8080/api/persons/paged?page=1&size=5&sortBy=email&direction=DESC');
      expect(req.request.method).toBe('GET');
      req.flush(mockPageResponse);
    });
  });

  describe('getById', () => {
    it('should return a person by id', () => {
      const mockPerson: Person = { id: '1', name: 'John Doe', email: 'john@example.com', birthDate: '1990-01-01' };

      service.getById('1').subscribe(person => {
        expect(person).toEqual(mockPerson);
      });

      const req = httpMock.expectOne('http://localhost:8080/api/persons/1');
      expect(req.request.method).toBe('GET');
      req.flush(mockPerson);
    });
  });

  describe('create', () => {
    it('should create a person', () => {
      const mockPerson: Person = { name: 'John Doe', email: 'john@example.com', birthDate: '1990-01-01' };
      const mockResponse: Person = { id: '1', ...mockPerson };

      service.create(mockPerson).subscribe(person => {
        expect(person).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('http://localhost:8080/api/persons');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockPerson);
      req.flush(mockResponse);
    });
  });

  describe('update', () => {
    it('should update a person', () => {
      const mockPerson: Person = { id: '1', name: 'John Updated', email: 'john@example.com', birthDate: '1990-01-01' };

      service.update('1', mockPerson).subscribe(person => {
        expect(person).toEqual(mockPerson);
      });

      const req = httpMock.expectOne('http://localhost:8080/api/persons/1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(mockPerson);
      req.flush(mockPerson);
    });
  });

  describe('delete', () => {
    it('should delete a person', () => {
      service.delete('1').subscribe(response => {
        expect(response).toBeNull();
      });

      const req = httpMock.expectOne('http://localhost:8080/api/persons/1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('searchByName', () => {
    it('should search persons by name', () => {
      const mockPersons: Person[] = [
        { id: '1', name: 'John Doe', email: 'john@example.com', birthDate: '1990-01-01' }
      ];

      service.searchByName('John').subscribe(persons => {
        expect(persons.length).toBe(1);
        expect(persons).toEqual(mockPersons);
      });

      const req = httpMock.expectOne('http://localhost:8080/api/persons/search?name=John');
      expect(req.request.method).toBe('GET');
      req.flush(mockPersons);
    });
  });

  describe('searchByNamePaged', () => {
    it('should search persons by name with pagination', () => {
      const mockPersons: Person[] = [
        { id: '1', name: 'John Doe', email: 'john@example.com', birthDate: '1990-01-01' }
      ];
      
      const mockPageResponse: PageResponse<Person> = {
        content: mockPersons,
        pageNumber: 0,
        pageSize: 10,
        totalElements: 1,
        totalPages: 1,
        last: true
      };

      service.searchByNamePaged('John').subscribe(response => {
        expect(response.content.length).toBe(1);
        expect(response.content).toEqual(mockPersons);
        expect(response.pageNumber).toBe(0);
        expect(response.pageSize).toBe(10);
        expect(response.totalElements).toBe(1);
        expect(response.totalPages).toBe(1);
        expect(response.last).toBe(true);
      });

      const req = httpMock.expectOne('http://localhost:8080/api/persons/search/paged?name=John&page=0&size=10&sortBy=name&direction=ASC');
      expect(req.request.method).toBe('GET');
      req.flush(mockPageResponse);
    });

    it('should search persons by name with custom pagination parameters', () => {
      const mockPersons: Person[] = [
        { id: '1', name: 'John Doe', email: 'john@example.com', birthDate: '1990-01-01' }
      ];
      
      const mockPageResponse: PageResponse<Person> = {
        content: mockPersons,
        pageNumber: 1,
        pageSize: 5,
        totalElements: 6,
        totalPages: 2,
        last: true
      };

      service.searchByNamePaged('John', 1, 5, 'email', 'DESC').subscribe(response => {
        expect(response.content.length).toBe(1);
        expect(response.content).toEqual(mockPersons);
        expect(response.pageNumber).toBe(1);
        expect(response.pageSize).toBe(5);
        expect(response.totalElements).toBe(6);
        expect(response.totalPages).toBe(2);
        expect(response.last).toBe(true);
      });

      const req = httpMock.expectOne('http://localhost:8080/api/persons/search/paged?name=John&page=1&size=5&sortBy=email&direction=DESC');
      expect(req.request.method).toBe('GET');
      req.flush(mockPageResponse);
    });
  });

  describe('clearCache', () => {
    it('should clear the cache', () => {
      service.clearCache().subscribe(response => {
        expect(response).toBeNull();
      });

      const req = httpMock.expectOne('http://localhost:8080/api/persons/cache/clear');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});