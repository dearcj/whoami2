FROM golang
ADD ./ /go/

#COPY ./wb.crt /wbserv/bin
#COPY ./wb.key /wbserv/bin

WORKDIR ./

RUN go install whoami
EXPOSE 8081
ENTRYPOINT "golangproj" -$OPT