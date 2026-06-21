import { OpenAuthConfig } from "./types";
import { OpenAuthAdapter } from "./repository";
import { signupAction } from "./auth/signup";
import { signinAction } from "./auth/signin";

export class OpenAuth {
  constructor(
    public readonly adapter: OpenAuthAdapter,
    public readonly config: OpenAuthConfig 
  ) {}

  async signup(input: any) {
    return signupAction(this, input);
  }

  async signin(input: any) {
    return signinAction(this, input);
  }
}