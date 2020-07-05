import {ask, chain, Reader} from "fp-ts/lib/Reader";
import {pipe} from "fp-ts/lib/pipeable";

const f = (b: boolean): string => (b ? 'true' : 'false')
const g = (n: number): string => f(n > 2)
const h = (s: string): string => g(s.length + 1)

// STAGE 1
// What if we want to add internationalization?
// In that case we have to add additional parameter 'deps' to EVERY function and that's the problem
// because g1 and h1 have to know about dependencies despite of not using them
interface Deps {
  i18n: {
    true: string
    false: string
  }
}

const f1 = (b: boolean, deps: Deps): string => (b ? deps.i18n.true : deps.i18n.false)
const g1 = (n: number, deps: Deps): string => f1(n > 2, deps)
const h1 = (s: string, deps: Deps): string => g1(s.length + 1, deps)

// STAGE 2
// Let's rewrite out functions using currying
const f2 = (b: boolean): ((deps: Deps) => string) => deps => (b ? deps.i18n.true : deps.i18n.false)
const g2 = (n: number): ((deps: Deps) => string) => f2(n > 2)
const h2 = (s: string): ((deps: Deps) => string) => g2(s.length + 1)

// STAGE 3
// Lets apply notion of Reader
const f3 = (b: boolean): Reader<Deps, string> => deps => (b ? deps.i18n.true : deps.i18n.false)
const g3 = (n: number): Reader<Deps, string> => f3(n > 2)
const h3 = (s: string): Reader<Deps, string> => g3(s.length + 1)

// STAGE 4
// What if we want to also inject the lower bound (2 in our example) in g? Let's add a new field to Dependencies first
interface Deps2 {
  i18n: {
    true: string
    false: string
  },
  lowerBound: number
}

const f4 = (b: boolean): Reader<Deps2, string> => deps => (b ? deps.i18n.true : deps.i18n.false)

// Now we can read lowerBound from the environment using ask
const g4 = (n: number): Reader<Deps2, string> =>
  pipe(
    ask<Deps2>(),
    chain(deps => f4(n > deps.lowerBound))
  )

// Is equivalent of
const g4q = (n: number): Reader<Deps2, string> =>
  (deps: Deps2) => {
    const {lowerBound} = deps
    return f4(n > deps.lowerBound)(deps)
  }

const h4 = (s: string): Reader<Deps2, string> => g4(s.length + 1)

const deps: Deps2 = {
  i18n: {
    true: 'vero',
    false: 'falso'
  },
  lowerBound: 2
}

console.log(h4('foo')({ ...deps, lowerBound: 4 })) // 'falso'