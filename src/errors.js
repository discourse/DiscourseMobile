export class UnexistingSite extends Error {
  constructor(...args) {
    super(...args);
    this.message = "The site is not present.";
  }
}
