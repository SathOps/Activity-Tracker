import { expect, test } from 'vitest';

import * as corpus from '../src/services/corpus/index.ts';
import * as corpusService from '../src/services/corpus/corpusService.ts';
import * as verification from '../src/utils/verification/index.ts';
import * as verificationImpl from '../src/utils/verification/verifyStandup.ts';

test('corpus barrel re-exports the service API', () => {
  expect(corpus.configureCorpusService).toBe(
    corpusService.configureCorpusService
  );
  expect(corpus.getInternAudios).toBe(corpusService.getInternAudios);
  expect(corpus.searchInternById).toBe(corpusService.searchInternById);
  expect(corpus.searchInternsByName).toBe(corpusService.searchInternsByName);
});

test('verification barrel re-exports the verification API', () => {
  expect(verification.isValidStandupSubmissionAudio).toBe(
    verificationImpl.isValidStandupSubmissionAudio
  );
  expect(verification.verifyStandupSubmission).toBe(
    verificationImpl.verifyStandupSubmission
  );
});
