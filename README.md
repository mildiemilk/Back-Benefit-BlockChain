# Benefitable API

## RSA Key Generation
```
cd config
ssh-keygen -t rsa -b 2048 -f jwt.key -C "jwt@benefitable"
openssl rsa -in jwt.key -pubout -outform PEM -out jwt.key.pub
```

