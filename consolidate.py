import os

files = [
    'docker-compose.yml',
    '.env',
    'backend/prisma/schema.prisma',
    'backend/src/index.ts',
    'backend/src/routes/auth.ts',
    'backend/src/routes/campaign.ts',
    'backend/src/routes/chat.ts',
    'backend/src/routes/user.ts',
    'ai_service/main.py',
    'ai_service/requirements.txt',
    'frontend/src/hooks/useApi.ts',
    'frontend/src/pages/Landing.tsx',
    'frontend/src/pages/Auth.tsx',
    'frontend/src/pages/Login.tsx',
    'frontend/src/pages/Register.tsx',
    'frontend/src/pages/Quiz.tsx',
    'frontend/src/pages/Chat.tsx',
    'frontend/src/pages/Settings.tsx',
    'frontend/src/i18n/index.ts'
]

with open('GR1_AllCode.txt', 'w', encoding='utf-8') as outfile:
    for filepath in files:
        if os.path.exists(filepath):
            outfile.write(f"\n{'='*80}\n")
            outfile.write(f"FILE: {filepath}\n")
            outfile.write(f"{'='*80}\n\n")
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as infile:
                outfile.write(infile.read())
            outfile.write("\n\n")

print("Consolidated code saved to GR1_AllCode.txt")
