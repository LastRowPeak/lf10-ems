import { TestBed } from '@angular/core/testing';

import { SkillRepositoryService } from './skill-repository.service';

describe('SkillRepositoryService', () => {
  let service: SkillRepositoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SkillRepositoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
