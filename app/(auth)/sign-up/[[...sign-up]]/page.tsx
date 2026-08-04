import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return (
    <SignUp
      routing="path"
      path="/sign-up"
      signInUrl="/sign-in"
      appearance={{
        elements: {
          rootBox: "w-full max-w-md",
          cardBox: "w-full",
        },
      }}
    />
  )
}
