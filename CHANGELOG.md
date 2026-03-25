# [1.1.0](https://github.com/andreysey/anki-b2/compare/v1.0.0...v1.1.0) (2026-03-25)


### Features

* implement BaseSelect component and integrate it into FilterBar, adding a study mode toggle. ([d70af2b](https://github.com/andreysey/anki-b2/commit/d70af2be8e9601ca5f5b65cead5090f3b15f79ec))

# 1.0.0 (2026-03-24)


### Bug Fixes

* Adjust base path and data fetching for deployment to a sub-directory. ([7e7a517](https://github.com/andreysey/anki-b2/commit/7e7a517b3329fff64f1f5e4d120f00ed461a2ea1))
* Update deploy.yml path triggers to include docs folder and update index title ([965c684](https://github.com/andreysey/anki-b2/commit/965c684840e3c6ed4280d9a950ea2124796bcd53))


### Features

* Add `_Minimal_Clean.txt` Quizlet deck generation and documentation. ([b8691ea](https://github.com/andreysey/anki-b2/commit/b8691eab6fcbcb6d2f6d0c974bf5634ad3a503a0))
* Add a generated tags column to Anki output. ([a83142b](https://github.com/andreysey/anki-b2/commit/a83142b854e91568af5fb698184f09b6bae50e64))
* Add a new study mode UI with flashcards and enhance data generation with gender colorization, example word highlighting, and refined punctuation checks. ([2f2bbcc](https://github.com/andreysey/anki-b2/commit/2f2bbcc9e537b027ab4f2aa846ccde49e7d5128f))
* Add a second Anki template for production cards to enable bi-directional learning. ([1f63e15](https://github.com/andreysey/anki-b2/commit/1f63e15b7d3ca41e4166fb35aac667072c304dbb))
* Add an audio pronunciation guide for Anki decks, update the README, and refresh vocabulary content. ([3492900](https://github.com/andreysey/anki-b2/commit/34929003f58b3dfb1dcbec8cd80e854e6cd46af4))
* add Anki B1+/B2 full and cleaned deck files ([56132fc](https://github.com/andreysey/anki-b2/commit/56132fccad369bde8e24ae3f0bf14e565cebdeb8))
* Add app version display to footer and update footer links to external GitHub URLs. ([e514c23](https://github.com/andreysey/anki-b2/commit/e514c23b477c1d8f494f25a3bf9ef83ee047808c))
* Add Cyrillic character validation to German, English, and Example data columns. ([497d8b4](https://github.com/andreysey/anki-b2/commit/497d8b4cb90bc71dfcb95dc3dbe87b98ae608631))
* Add GitHub Actions workflow for building decks and deploying to GitHub Pages. ([4a4a557](https://github.com/andreysey/anki-b2/commit/4a4a557783af4c0b5f875d67a5e4f24bd32e1c89))
* Add highlighting to example sentences in Anki packages and align word boundary detection with Rust's byte-length for UTF-8 consistency. ([a4b265e](https://github.com/andreysey/anki-b2/commit/a4b265e3a4ebb49fdc8fb24e88db9e2fdbcb7668))
* Add pre-commit hook for build and version automation, update service worker cache, and display app version in the UI. ([178f5c7](https://github.com/andreysey/anki-b2/commit/178f5c7752f68f8802abe38e10f24bf6cbc5b6fb))
* Add Quizlet minimal deck generation and restructure output into `anki/` and `quizlet/` directories. ([f9ec9fa](https://github.com/andreysey/anki-b2/commit/f9ec9faa357cbd4dc33506368f04615d04efffba))
* Add Rust toolchain setup and build command to the deployment workflow. ([4ee2cba](https://github.com/andreysey/anki-b2/commit/4ee2cba2678705959016ab81f8aa1588fecec547))
* Dynamically filter theme options based on the selected level and update the service worker cache version. ([b1b2357](https://github.com/andreysey/anki-b2/commit/b1b2357c1bb2e09d4bff871c0fd610d5d2c60faa))
* Generate Anki decks directly as `.apkg` files using `genanki-rs` instead of plain text. ([0ed1f19](https://github.com/andreysey/anki-b2/commit/0ed1f193b3f548e6f8050c30aaf9b68a73f8fd02))
* Implement "Load More" functionality to paginate vocabulary grid results. ([294d0d9](https://github.com/andreysey/anki-b2/commit/294d0d9e66cbd5cac450581b9d5f2c48eb5c59b5))
* implement a basic Space Repetition System (SRS) for flashcards with UI controls, review logic, and sorting. ([2f3012f](https://github.com/andreysey/anki-b2/commit/2f3012fb46bfaf2d4b48c4c96dbabd58de8351ef))
* Implement Anki package generation with new scripts, updated data structure, and regenerated decks. ([c8f88f4](https://github.com/andreysey/anki-b2/commit/c8f88f49d5be558fb42619187fafa149b0ee515d))
* Implement German word text-to-speech functionality and enhance data validation with checks for duplicates, punctuation, and formatting. ([62bf510](https://github.com/andreysey/anki-b2/commit/62bf5102b7368d60606cbbb8676c7963d402a2c4))
* Implement multi-language TTS for Anki cards by adding new audio fields and updating templates, and stop ignoring generated Anki packages. ([34ad57b](https://github.com/andreysey/anki-b2/commit/34ad57bbd123ec729c869af3226798e616c2cdaf))
* Implement Progressive Web App (PWA) features including manifest, service worker, and icons. ([375ab7f](https://github.com/andreysey/anki-b2/commit/375ab7f43e89226e2214a3c6e19a324391849ce2))
* Implement Quizlet deck generation and restructure files into dedicated `source`, `anki`, and `quizlet` directories. ([f74f549](https://github.com/andreysey/anki-b2/commit/f74f549366ff115a8aaf47d3d999f481e1f7bbeb))
* Implement study direction toggle for flashcards and refine study controls styling for responsiveness. ([949778e](https://github.com/andreysey/anki-b2/commit/949778e1fac0fe82a22c93a325dd2d10ddb534f9))
* Implement study mode progress bar, card shuffling, audio autoplay, and mastered card tracking, and update Anki decks. ([4a2e6a3](https://github.com/andreysey/anki-b2/commit/4a2e6a3ec4719b4bba0636adf9cdf9f91ecccd7e))
* Introduce an interactive vocabulary website and update README with details and a new deck format. ([fbd4fe6](https://github.com/andreysey/anki-b2/commit/fbd4fe644db8cd1242251ba527b8bb80ee779ef8))
* Introduce automation scripts for Anki deck generation and standardization, and update README documentation. ([49cd71d](https://github.com/andreysey/anki-b2/commit/49cd71d9d7cc3797d906b2737b88e0a88003760a))
* Introduce dedicated TypeScript configuration for build scripts, ensure Anki models are included in generated decks, and update documentation and script paths accordingly. ([40836c6](https://github.com/andreysey/anki-b2/commit/40836c6b90d0a4773dc43e46413e87c492ef5398))
* Migrate frontend to Vue 3 + Vite + TypeScript ([978cd97](https://github.com/andreysey/anki-b2/commit/978cd977e9a28151747f104ac9c7be891c809616))
* Replace the Rust build system with a Node.js script for generating Anki decks and update the README accordingly. ([4e746a0](https://github.com/andreysey/anki-b2/commit/4e746a008d0969332ed94b72fc4acdbd5a26ae98))
* Rewrite deck generation and standardization logic in Rust and Python, update build process, and regenerate decks. ([e71da9e](https://github.com/andreysey/anki-b2/commit/e71da9ef64c5a6ccab896df518adfe891dd25873))
* Translate all UI text and messages ([df3ad84](https://github.com/andreysey/anki-b2/commit/df3ad842b11cb525fc44ba9b3c49280b6dbd88d9))
* Update Anki B1+, B1+B2, and B2 content packages. ([b70f2f1](https://github.com/andreysey/anki-b2/commit/b70f2f10b3da827fb1c7a7c36d73edf5a505c9d0))
* Update B1plus and B2 Anki/Quizlet deck and source content across various themes and versions. ([87d3e90](https://github.com/andreysey/anki-b2/commit/87d3e906b7211f28a0f4c22182335a32af5aa405))
* Update German vocabulary content to B2 Beruf course, including Ukrainian translations and example sentences, and reflect these changes in the README. ([f29dab3](https://github.com/andreysey/anki-b2/commit/f29dab3cb6745f615c0e7afa059ceaff8df688bc))
