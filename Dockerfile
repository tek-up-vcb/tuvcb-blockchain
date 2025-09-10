FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
# Installer toutes les deps (prod + dev) pour build Hardhat + Nest
RUN npm ci || npm install --production=false

FROM deps AS build
COPY . .
# Compile les smart contracts (échec si la compilation échoue)
RUN npx hardhat compile
# Build NestJS -> dist
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Copier uniquement le package.json et lock pour installation clean prod
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copier la sortie compilée
COPY --from=build /app/dist ./dist
# Copier les artifacts nécessaires à l'exécution (contrats)
COPY --from=build /app/src/Blockchain/artifacts ./src/Blockchain/artifacts

# (Optionnel) copier .env si vous buildiez avec des variables build-time (sinon utiliser -e / secrets)
# COPY .env ./.env

# Vérification que ethers est bien présent (débogage build)
RUN node -e "require.resolve('ethers') && console.log('ethers OK')"

EXPOSE 3000
CMD ["node", "dist/main.js"]