

## Plan: Add edge function config entries

Append two new function entries to the end of `supabase/config.toml`:

```toml
[functions.underwriting-process]
verify_jwt = false

[functions.underwriting-chat]
verify_jwt = false
```

No other changes to the file.

