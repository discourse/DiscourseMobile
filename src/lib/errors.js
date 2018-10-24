export class UnexistingSite extends Error {
  constructor(...args) {
    super(...args);
    this.message = "The site is not present.";
  }
}

export class InvalidSite extends Error {
  constructor(...args) {
    super(...args);
    this.message = "Couldn’t add this site.";
  }
}

export class BadApi extends Error {
  constructor(...args) {
    super(...args);
    this.message = "This forum is using an outdated version of Discourse.";
  }
}

export class DomainError extends Error {
  constructor(...args) {
    super(...args);
    this.message = "Couldn’t reach this domain, check your URL.";
  }
}

export class DupeSite extends Error {
  constructor(...args) {
    super(...args);
    this.message = "This site is already tracked.";
  }
}

export class UnknownError extends Error {
  constructor(...args) {
    super(...args);
    this.message = "Unknown error.";
  }
}

export class RateLimit extends Error {
  constructor(...args) {
    super(...args);
    this.message = "Too many requests.";
  }
}
