import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <SignIn
      routing="path"
      path="/sign-in"
      signUpUrl="/sign-up"
      appearance={{
        elements: {
          rootBox: "w-full max-w-md",
          cardBox: "w-full",
        },
      }}
    />
  )
}
