import { useState } from "react"
import { EyeOpenIcon, EyeClosedIcon } from "@radix-ui/react-icons"

export default function PasswordInput({ password, setPassword }:{password : string , setPassword:Function}) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="relative w-full mb-4">
      <input
        type={showPassword ? "text" : "password"}
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="text-foreground w-full p-3 pr-10 border rounded-lg focus:outline-none focus:ring-0 placeholder-zinc-400"
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
      >
        {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
      </button>
    </div>
  )
}
