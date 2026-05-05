package com.invinciblegame.controller;

import com.invinciblegame.dto.response.PullResultResponse;
import com.invinciblegame.dto.response.PullStatusResponse;
import com.invinciblegame.service.PullService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pulls")
public class PullController {
    private final PullService pullService;

    public PullController(PullService pullService) {
        this.pullService = pullService;
    }

    @GetMapping("/status")
    public PullStatusResponse status() {
        return pullService.status();
    }

    @PostMapping("/welcome")
    public PullResultResponse welcome() {
        return pullService.welcomePull();
    }

    @PostMapping("/daily")
    public PullResultResponse daily() {
        return pullService.dailyPull();
    }
}
