import { Injectable } from '@angular/core';
import { GlobalService } from '../global.service';
const signalR = require("@microsoft/signalr");

@Injectable({
  providedIn: 'root'
})
export class SignalRService {


  private hubConnection;
  public data;

  constructor(public global: GlobalService) { }

  public startConnection = () => {
    this.hubConnection = new signalR.HubConnectionBuilder()
                            .withUrl(this.global.signalR_Api)
                            .build();
    this.hubConnection
      .start()
      .then(() => console.log('Connection with SignalR APi Service started'))
      .catch(err => console.log('Error while starting connection with SignalR APi Service: ' + err))
  }

  public addTransferNotificationtDataListener = () => {
    this.hubConnection.on('notifications', (notification) => {
      this.data = notification;
      // console.log(this.data)
    });
  }
}
