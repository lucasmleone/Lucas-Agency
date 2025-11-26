#!/bin/bash
mkdir -p nginx/certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout nginx/certs/selfsigned.key \
    -out nginx/certs/selfsigned.crt \
    -subj "/C=AR/ST=BuenosAires/L=BuenosAires/O=LucasAgency/OU=IT/CN=localhost"
echo "Certificados SSL generados en nginx/certs/"
